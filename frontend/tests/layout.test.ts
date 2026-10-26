import { test } from "node:test";
import assert from "node:assert/strict";
import { createMockProject } from "../src/mocks/project.ts";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  findDemoNode,
  layoutWorkflow,
  updateDemoNode,
} from "../src/features/workflow/layout.ts";

test("collapsed view has 11 main stages, 3 shot containers and connected branches", () => {
  const project = createMockProject();
  const graph = layoutWorkflow(project, new Set());
  assert.equal(graph.nodes.length, 14);
  assert.equal(graph.edges.length, 15);
  for (const shot of project.shots) {
    assert.ok(
      graph.edges.some((e) => e.source === "splitter" && e.target === shot.id),
    );
    assert.ok(
      graph.edges.some((e) => e.source === shot.id && e.target === "merger"),
    );
    assert.ok(!graph.nodes.some((n) => n.id.startsWith(`${shot.id}-`)));
  }
});

test("expanding a shot connects S1-S6 in order and rewires its merger edge", () => {
  const project = createMockProject();
  const expanded = layoutWorkflow(project, new Set(["shot-01"]));
  assert.equal(expanded.nodes.length, 20);
  let source = "shot-01";
  for (let i = 1; i <= 6; i++) {
    const target = `shot-01-s${i}`;
    assert.ok(
      expanded.edges.some((e) => e.source === source && e.target === target),
    );
    source = target;
  }
  assert.ok(
    expanded.edges.some((e) => e.source === source && e.target === "merger"),
  );
  assert.ok(
    !expanded.edges.some(
      (e) => e.source === "shot-01" && e.target === "merger",
    ),
  );
  assert.deepEqual(
    layoutWorkflow(project, new Set()),
    layoutWorkflow(createMockProject(), new Set()),
  );
});

test("mixed expansion has valid forward edges and no overlapping node rectangles", () => {
  const project = createMockProject();
  const graph = layoutWorkflow(
    project,
    new Set(["characters", "scenes", "shot-01", "shot-03"]),
  );
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  assert.equal(byId.size, graph.nodes.length);
  for (const edge of graph.edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    assert.ok(source && target, "each edge endpoint must be visible");
    assert.ok(
      target.position.x > source.position.x,
      "layout must progress left to right",
    );
  }
  for (let i = 0; i < graph.nodes.length; i++)
    for (let j = i + 1; j < graph.nodes.length; j++) {
      const a = graph.nodes[i]!;
      const b = graph.nodes[j]!;
      assert.ok(
        Math.abs(a.position.x - b.position.x) >= CARD_WIDTH ||
          Math.abs(a.position.y - b.position.y) >= CARD_HEIGHT,
        `${a.id} overlaps ${b.id}`,
      );
    }
});

test("branch topology derives from the supplied shots, rather than a fixed three", () => {
  const project = createMockProject();
  project.shots = [project.shots[0]!];
  const graph = layoutWorkflow(project, new Set(["shot-01"]));
  assert.equal(graph.nodes.filter((n) => n.shot).length, 1);
  assert.equal(graph.edges.filter((e) => e.source === "splitter").length, 1);
  assert.equal(graph.edges.filter((e) => e.target === "merger").length, 1);
});

test("Mock edits are isolated, immutable and do not execute downstream nodes", () => {
  const original = createMockProject();
  const changed = updateDemoNode(original, "shot-01-s3", (node) => ({
    ...node,
    status: "passed",
    config: { ...node.config, reviewComment: "Demo approval" },
  }));
  assert.equal(findDemoNode(original, "shot-01-s3")?.status, "review");
  assert.equal(findDemoNode(changed, "shot-01-s3")?.status, "passed");
  assert.equal(findDemoNode(changed, "shot-01-s4")?.status, "pending");
  assert.deepEqual(original.shots[1], changed.shots[1]);
  assert.equal(
    findDemoNode(createMockProject(), "shot-01-s3")?.config.reviewComment,
    "",
  );
});
