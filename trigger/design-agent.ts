import { task } from "@trigger.dev/sdk";
import { z } from "zod";
import { generateObject } from "ai";
import { liveblocks } from "@/lib/liveblocks-client";
import { runWithFailover } from "@/lib/google-failover";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";
import { AiStatusMessage, AiChatMessage } from "@/types/tasks";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// Zod schemas for Gemini output
const NodeMutationSchema = z.object({
  type: z.enum(["add", "update", "delete"]),
  id: z.string().describe("Unique ID for the node. E.g. 'node_1', 'user_svc', etc."),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional()
    .describe("X and Y coordinates on the canvas."),
  label: z.string().optional().describe("Display text label of the node. REQUIRED for new nodes. Do NOT use generic names like 'New Node'."),
  shape: z
    .enum(NODE_SHAPES)
    .optional()
    .describe("Shape of the node. REQUIRED for new nodes. Choose semantically."),
  color: z
    .string()
    .optional()
    .describe("Hex fill color of the node. REQUIRED for new nodes. Group related services by color. Must be one of: #1F1F1F, #10233D, #2E1938, #331B00, #3C1618, #3A1726, #0F2E18, #062822"),
  width: z.number().optional().describe("Width of the node. Must follow the standard size for the chosen shape (e.g., rectangle: 180, diamond: 110, circle: 90, pill: 140, cylinder: 110, hexagon: 130)."),
  height: z.number().optional().describe("Height of the node. Must follow the standard size for the chosen shape (e.g., rectangle: 80, diamond: 110, circle: 90, pill: 60, cylinder: 110, hexagon: 110)."),
});

const EdgeMutationSchema = z.object({
  type: z.enum(["add", "delete"]),
  id: z.string().describe("Unique ID for the edge. E.g. 'edge_1' or 'node1-node2'"),
  source: z.string().optional().describe("Source node ID"),
  target: z.string().optional().describe("Target node ID"),
  sourceHandle: z.string().optional().describe("Handle ID on source node. E.g. 'right-source', 'bottom-source', 'left-source', 'top-source'"),
  targetHandle: z.string().optional().describe("Handle ID on target node. E.g. 'left-target', 'top-target', 'right-target', 'bottom-target'"),
  label: z.string().optional().describe("Short edge label (1-3 words MAX). Describes the protocol or relationship, e.g. 'REST', 'gRPC', 'Pub/Sub', 'Reads', 'Writes'. NEVER repeat the node name here."),
});

const GeminiOutputSchema = z.object({
  explanation: z
    .string()
    .describe("A brief, friendly recap of what you created, modified, or deleted, matching the user's request."),
  nodes: z.array(NodeMutationSchema),
  edges: z.array(EdgeMutationSchema),
});

// Helper for waiting/delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to push status updates
async function pushStatus(roomId: string, text: string, status?: string) {
  const secretKey =
    process.env.LIVEBLOCKS_SECRET_KEY || process.env.LIVEBLOCKS_SECRETE_KEY;
  if (!secretKey) return;

  const msg: AiStatusMessage = {
    text,
    status,
    timestamp: Date.now(),
  };

  try {
    await fetch(`https://api.liveblocks.io/v2/rooms/${roomId}/storage/json-patch`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          op: "add",
          path: "/ai-status-feed/-",
          value: msg,
        },
      ]),
    });
  } catch (err) {
    console.error("[design-agent] Failed to push status message:", err);
  }
}

// Helper to update presence
async function updatePresence(
  roomId: string,
  thinking: boolean,
  cursor: { x: number; y: number } | null
) {
  const secretKey =
    process.env.LIVEBLOCKS_SECRET_KEY || process.env.LIVEBLOCKS_SECRETE_KEY;
  if (!secretKey) return;

  try {
    await fetch(`https://api.liveblocks.io/v2/rooms/${roomId}/presence`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "ai-agent",
        data: {
          cursor,
          thinking,
        },
        userInfo: {
          name: "Archi_Dev",
          avatar: "https://avatar.vercel.sh/ai-agent",
          color: "#62C073",
        },
        ttl: 30,
      }),
    });
  } catch (err) {
    console.error("[design-agent] Failed to update presence:", err);
  }
}

// Helper to apply storage patch
async function patchStorage(roomId: string, operations: any[]) {
  const secretKey =
    process.env.LIVEBLOCKS_SECRET_KEY || process.env.LIVEBLOCKS_SECRETE_KEY;
  if (!secretKey) throw new Error("LIVEBLOCKS_SECRET_KEY is missing");

  const res = await fetch(
    `https://api.liveblocks.io/v2/rooms/${roomId}/storage/json-patch`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(operations),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Liveblocks patch storage failed: ${res.status} ${res.statusText} - ${errorText}`
    );
  }
}

// Helper to push final message to ai-chat
async function pushChatMessage(roomId: string, content: string) {
  const secretKey =
    process.env.LIVEBLOCKS_SECRET_KEY || process.env.LIVEBLOCKS_SECRETE_KEY;
  if (!secretKey) return;

  const msg: AiChatMessage = {
    id: `chat-${Math.random().toString(36).substring(7)}`,
    sender: "Archi_Dev",
    role: "assistant",
    content,
    timestamp: Date.now(),
  };

  try {
    await fetch(`https://api.liveblocks.io/v2/rooms/${roomId}/storage/json-patch`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          op: "add",
          path: "/ai-chat/-",
          value: msg,
        },
      ]),
    });
  } catch (err) {
    console.error("[design-agent] Failed to push chat message:", err);
  }
}

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;
    console.log(`[design-agent] Triggered with prompt: "${prompt}" inside room: "${roomId}"`);

    // 1. Set presence to thinking at a default starting point
    await updatePresence(roomId, true, { x: 100, y: 100 });
    await pushStatus(roomId, "Archi_Dev is starting to analyze your prompt...", "starting");

    // 2. Retrieve the current graph state from Liveblocks storage
    let currentNodes: Record<string, any> = {};
    let currentEdges: Record<string, any> = {};

    try {
      const storage = await liveblocks.getStorageDocument(roomId, "json");
      if (storage && typeof storage === "object") {
        const flow = (storage as any).flow;
        if (flow) {
          if (flow.nodes && typeof flow.nodes === "object") {
            currentNodes = flow.nodes;
          }
          if (flow.edges && typeof flow.edges === "object") {
            currentEdges = flow.edges;
          }
        }
      }
    } catch (err) {
      console.warn("[design-agent] Failed to fetch current storage. Starting with empty canvas.", err);
    }

    const nodesArray = Object.values(currentNodes);
    const edgesArray = Object.values(currentEdges);

    try {
      // 3. Ask Gemini for the mutations to execute
      await pushStatus(roomId, "Generating system design architecture layout...", "processing");

      const geminiResult = await runWithFailover(async (model) => {
        const promptString = `You are a professional system architecture designer who is an expert in building distributed systems and software architecture with over 20 years of experience. You are named Archi_Dev.
Your primary objective is to produce highly refined, production-grade system designs.
You generate visual architecture diagrams on a collaborative canvas.
You must output a list of mutations (add, update, delete) to the canvas elements (nodes and edges) to fulfill the user's request.

Allowed Node Shapes (and standard dimensions):
- rectangle (width: 180, height: 80)
- diamond (width: 110, height: 110)
- circle (width: 90, height: 90)
- pill (width: 140, height: 60)
- cylinder (width: 110, height: 110)
- hexagon (width: 130, height: 110)

Allowed Colors (Hex values ONLY):
- Neutral dark: "#1F1F1F"
- Blue: "#10233D"
- Purple: "#2E1938"
- Orange: "#331B00"
- Red: "#3C1618"
- Pink: "#3A1726"
- Green: "#0F2E18"
- Teal: "#062822"

═══════════════════════════════════════
  SHAPE & COLOR SEMANTICS (MUST FOLLOW)
═══════════════════════════════════════

Use shapes meaningfully to represent the type of component:
- "rectangle": Standard services, APIs, web clients, frontend apps.
- "cylinder": Databases, caches, file storage (SQL, NoSQL, Redis, S3).
- "diamond": Message brokers, event buses, logic gates, load balancers, WebSockets.
- "hexagon": External 3rd party services, webhooks, outside world.
- "pill": Queues, data streams, background workers.
- "circle": Users, clients, simple nodes.

Use colors to group related services (e.g. all auth services in Purple, all storage in Green, etc).
When adding ANY new node, you MUST provide a descriptive label, shape, and color. NEVER leave them blank or use generic names like "New Node".

═══════════════════════════════════════
  CRITICAL LABEL RULES (MUST FOLLOW)
═══════════════════════════════════════

1. NODE LABELS = Component / service names ONLY. Short (1-3 words).
   ✓ Good: "Auth Service", "API Gateway", "User DB", "Cache"
   ✗ Bad:  "New Node", "HTTPS/Login", "Writes/Reads Data", "REST API Call"
   A node label should NEVER contain a protocol, verb, action, or the word "New Node".

2. EDGE LABELS = Protocol or relationship ONLY. Max 1-3 words.
   ✓ Good: "REST", "gRPC", "Pub/Sub", "Reads", "Writes", "WebSocket", "HTTPS"
   ✗ Bad:  "HTTPS/View Courses", "Internal API/Verify User", "Writes/Reads User Data"
   An edge label should NEVER contain a resource name, endpoint path, or the names of the nodes it connects.

═══════════════════════════════════════
  LAYOUT & SPACING RULES
═══════════════════════════════════════

- Position nodes in a clear grid-like layout (rows/columns) with logical flow (left→right or top→bottom).
- Minimum spacing: 250px center-to-center horizontally, 200px center-to-center vertically.
  This leaves enough gap for edge labels to sit between nodes without overlapping node boxes.
- Leave extra vertical or horizontal clearance wherever many edges will pass between two rows/columns.

═══════════════════════════════════════
  EDGE ROUTING RULES (PREVENT OVERLAP)
═══════════════════════════════════════

- Handle IDs: "top-source", "top-target", "bottom-source", "bottom-target", "left-source", "left-target", "right-source", "right-target".
- When connecting nodes in the SAME ROW: prefer right-source → left-target (left-to-right) or left-source → right-target (right-to-left).
- When connecting nodes in DIFFERENT ROWS: prefer bottom-source → top-target (top-to-bottom) or top-source → bottom-target (bottom-to-top).
- CRITICAL: When multiple edges connect to the SAME node, distribute them across DIFFERENT handles.
  For example, if 3 edges arrive at a node, use top-target for one, left-target for another, and right-target for the third.
  This prevents edges from stacking on the same corridor and overlapping their labels.

Existing Canvas Graph State:
Nodes: ${JSON.stringify(nodesArray)}
Edges: ${JSON.stringify(edgesArray)}

User Request: "${prompt}"

Return the modifications required. Keep the graph coherent, organized, and clean. Provide a brief friendly explanation of what you changed or built.`;

        const response = await generateObject({
          model,
          schema: GeminiOutputSchema,
          prompt: promptString,
        });

        return response.object;
      });

      console.log("[design-agent] Gemini generated mutations:", JSON.stringify(geminiResult, null, 2));

      // 4. Apply Mutations step-by-step to simulate collaborative AI activity
      const { nodes, edges, explanation } = geminiResult;

      // Handle deletions first
      const nodeDeletions = nodes.filter((n) => n.type === "delete");
      const edgeDeletions = edges.filter((e) => e.type === "delete");

      for (const e of edgeDeletions) {
        await pushStatus(roomId, `Removing connection ${e.id}...`, "processing");
        await patchStorage(roomId, [{ op: "remove", path: `/flow/edges/${e.id}` }]);
        await delay(300);
      }

      for (const n of nodeDeletions) {
        await pushStatus(roomId, `Removing node ${n.label || n.id}...`, "processing");
        await patchStorage(roomId, [{ op: "remove", path: `/flow/nodes/${n.id}` }]);
        // Also remove any edges connected to this deleted node to prevent dangling connections
        const danglingEdges = edgesArray.filter(
          (edge) => edge.source === n.id || edge.target === n.id
        );
        for (const de of danglingEdges) {
          try {
            await patchStorage(roomId, [{ op: "remove", path: `/flow/edges/${de.id}` }]);
          } catch {
            // Safe to ignore if already deleted
          }
        }
        await delay(300);
      }

      // Handle additions and updates
      const nodeCreations = nodes.filter((n) => n.type === "add" || n.type === "update");

      for (const n of nodeCreations) {
        const x = n.position?.x ?? 100;
        const y = n.position?.y ?? 100;
        const width = n.width ?? 90;
        const height = n.height ?? 50;
        const color = n.color ?? "#1F1F1F";
        const shape = n.shape ?? "rectangle";
        const label = n.label ?? "New Node";

        // Move cursor near target location
        await updatePresence(roomId, true, { x: x + width / 2, y: y + height / 2 });
        await pushStatus(
          roomId,
          n.type === "add" ? `Placing Node: ${label}...` : `Updating Node: ${label}...`,
          "processing"
        );

        // Perform patch operation
        await patchStorage(roomId, [
          {
            op: "add",
            path: `/flow/nodes/${n.id}`,
            value: {
              id: n.id,
              type: "customNode",
              position: { x, y },
              data: {
                label,
                shape,
                color,
              },
              width,
              height,
            },
          },
        ]);

        await delay(600);
      }

      // Handle edge additions
      const edgeCreations = edges.filter((e) => e.type === "add");

      for (const e of edgeCreations) {
        const sourceNode = nodes.find((n) => n.id === e.source) || currentNodes[e.source || ""];
        const targetNode = nodes.find((n) => n.id === e.target) || currentNodes[e.target || ""];

        if (sourceNode && targetNode) {
          // Simulate cursor moving from source to target
          const sourceX = sourceNode.position?.x ?? sourceNode.x ?? 0;
          const sourceY = sourceNode.position?.y ?? sourceNode.y ?? 0;
          const targetX = targetNode.position?.x ?? targetNode.x ?? 0;
          const targetY = targetNode.position?.y ?? targetNode.y ?? 0;

          await updatePresence(roomId, true, { x: sourceX, y: sourceY });
          await delay(200);
          await updatePresence(roomId, true, { x: targetX, y: targetY });
        }

        const label = e.label || "";
        await pushStatus(roomId, `Connecting ${sourceNode?.label || e.source} to ${targetNode?.label || e.target}...`, "processing");

        await patchStorage(roomId, [
          {
            op: "add",
            path: `/flow/edges/${e.id}`,
            value: {
              id: e.id,
              type: "customEdge",
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle || "right-source",
              targetHandle: e.targetHandle || "left-target",
              label,
              data: {
                label,
              },
            },
          },
        ]);

        await delay(400);
      }

      // 5. Finalize the task run successfully
      await pushStatus(roomId, "Design complete!", "complete");
      await updatePresence(roomId, false, null);
      await pushChatMessage(roomId, explanation);

      return {
        success: true,
        message: "Successfully processed design changes.",
        explanation,
      };
    } catch (err: any) {
      console.error("[design-agent] Error during execution:", err);

      // Handle errors gracefully: post error message to chat and status
      const errMsg = err?.message || String(err);
      await pushStatus(roomId, "Error: Failed to process design request.", "error");
      await updatePresence(roomId, false, null);
      await pushChatMessage(
        roomId,
        `Sorry, I encountered an error while processing your request: "${errMsg}". Please try again.`
      );

      return {
        success: false,
        error: errMsg,
      };
    }
  },
});
