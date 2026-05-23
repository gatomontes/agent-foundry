import type { MissionTopology } from "./types.js";

export function validateTopology(topology: MissionTopology): void {
  const nodeIds = new Set(topology.nodes.map((node) => node.id));

  if (topology.nodes.length === 0) {
    throw new Error("Topology must contain at least one node.");
  }

  for (const edge of topology.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Topology edge ${edge.from} -> ${edge.to} references an unknown node.`);
    }
  }

  const topologyProfessionIds = new Set(
    topology.nodes
      .map((node) => node.professionId)
      .filter((professionId): professionId is string => professionId !== undefined),
  );

  for (const professionId of topology.requiredProfessionIds) {
    if (!topologyProfessionIds.has(professionId)) {
      throw new Error(`Topology is missing required profession node ${professionId}.`);
    }
  }
}

export function orderedNodeIds(topology: MissionTopology): string[] {
  validateTopology(topology);

  const inboundCount = new Map<string, number>(topology.nodes.map((node) => [node.id, 0]));
  const adjacency = new Map<string, string[]>();

  for (const node of topology.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of topology.edges) {
    adjacency.get(edge.from)?.push(edge.to);
    inboundCount.set(edge.to, (inboundCount.get(edge.to) ?? 0) + 1);
  }

  const queue = [...inboundCount.entries()]
    .filter(([, count]) => count === 0)
    .map(([nodeId]) => nodeId);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift();

    if (!nodeId) {
      continue;
    }

    ordered.push(nodeId);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const nextCount = (inboundCount.get(neighbor) ?? 0) - 1;
      inboundCount.set(neighbor, nextCount);

      if (nextCount === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (ordered.length !== topology.nodes.length) {
    throw new Error(`Topology ${topology.missionId} contains a cycle or unreachable ordering state.`);
  }

  return ordered;
}
