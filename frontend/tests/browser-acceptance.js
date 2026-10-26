// Run with an existing Playwright CLI session using: run-code --filename frontend/tests/browser-acceptance.js
// Tests local Demo UI only. No external service, model, or persistence is involved.
async function verifyFrontendDemo(page) {
  const checks = [];
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
    checks.push(label);
  };
  const fit = async () => {
    await page.getByRole("button", { name: /适应画布/ }).click();
    await page.waitForTimeout(450);
  };
  await page.goto("http://127.0.0.1:5173");
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.getByTestId("card-shot-01").waitFor();
  check(
    (await page.locator(".react-flow__node").count()) === 14,
    "default: 11 stages and 3 collapsed shots",
  );
  check(
    (await page.locator(".react-flow__edge").count()) === 15,
    "default: 15 actual React Flow edges",
  );
  await page.getByRole("button", { name: "展开分镜 01", exact: true }).click();
  check(
    (await page.locator(".react-flow__node").count()) === 20,
    "shot expansion adds all six steps",
  );
  check(
    (await page.locator(".react-flow__edge").count()) === 21,
    "expansion rewires actual edges",
  );
  for (let i = 1; i <= 6; i++) {
    await fit();
    await page.getByTestId(`card-shot-01-s${i}`).click();
    check(
      (await page.getByTestId("node-details").innerText()).includes(
        `shot-01-s${i}`,
      ),
      `S${i} opens its own details`,
    );
  }
  await fit();
  await page.getByTestId("card-shot-01-s2").click();
  await page
    .getByRole("textbox", { name: "模拟提示词", exact: true })
    .fill("Demo acceptance: keep the character consistent.");
  await page.getByRole("combobox", { name: "模拟模型选择" }).click();
  await page.getByText("云端模型 · Demo", { exact: true }).click();
  await fit();
  await page.getByTestId("card-shot-01-s3").click();
  await page
    .getByRole("textbox", { name: "模拟审核意见" })
    .fill("Demo approval only");
  await page.getByRole("button", { name: /模拟通过/ }).click();
  check(
    (await page.getByTestId("node-details").innerText()).includes("已通过"),
    "Mock approval changes selected review status",
  );
  check(
    (await page.getByTestId("card-shot-01-s4").innerText()).includes("待执行"),
    "approval does not execute downstream",
  );
  await page.getByRole("button", { name: /模拟驳回/ }).click();
  check(
    (await page.getByTestId("node-details").innerText()).includes("失败"),
    "Mock rejection changes selected review status",
  );
  await page.getByRole("tab", { name: "运行日志" }).click();
  check(
    (await page.getByTestId("node-details").innerText()).includes(
      "[Demo] 模拟审核驳回",
    ),
    "logs explicitly show Mock actions",
  );
  await fit();
  await page.getByTestId("card-shot-01-s2").click();
  check(
    (await page
      .getByRole("textbox", { name: "模拟提示词", exact: true })
      .inputValue()) === "Demo acceptance: keep the character consistent.",
    "prompt survives switching selected nodes",
  );
  check(
    (await page.getByTestId("node-details").innerText()).includes(
      "云端模型 · Demo",
    ),
    "model selection survives switching selected nodes",
  );
  await page.getByRole("button", { name: "关闭节点详情" }).click();
  check(
    (await page.getByTestId("node-details").count()) === 0,
    "detail panel closes",
  );
  await fit();
  await page.getByRole("button", { name: "折叠分镜 01", exact: true }).click();
  check(
    (await page.locator(".react-flow__node").count()) === 14,
    "shot collapses back to summary",
  );
  check(
    (await page.locator(".react-flow__edge").count()) === 15,
    "collapse restores summary connections",
  );
  await fit();
  await page.getByRole("button", { name: "展开人物资产", exact: true }).click();
  await fit();
  check(
    (await page.locator(".react-flow__node").count()) === 17,
    "character asset child nodes expand",
  );
  await page.getByRole("button", { name: "展开场景资产", exact: true }).click();
  await fit();
  check(
    (await page.locator(".react-flow__node").count()) === 20,
    "scene asset child nodes expand",
  );
  await page.getByRole("button", { name: "折叠所有节点", exact: true }).click();
  check(
    (await page.locator(".react-flow__node").count()) === 14,
    "global collapse restores the default graph",
  );
  await page.getByRole("button", { name: /人物资产 3/ }).click();
  check(
    (await page.locator(".asset-card").count()) === 3,
    "character workspace contains three Mock assets",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /场景资产 2/ }).click();
  check(
    (await page.locator(".asset-card").count()) === 2,
    "scene workspace contains two Mock assets",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /模型中心/ }).click();
  check(
    (await page.getByRole("dialog").innerText()).includes("Demo 占位"),
    "model center is explicitly a placeholder",
  );
  await page.getByRole("button", { name: "知道了" }).click();
  await page.getByRole("button", { name: /分镜生产区/ }).click();
  await page.waitForTimeout(450);
  const node = page.getByTestId("card-shot-02");
  const before = await node.boundingBox();
  if (!before) throw new Error("shot card must be visible for drag check");
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    before.x + before.width / 2 + 45,
    before.y + before.height / 2 + 30,
    { steps: 8 },
  );
  await page.mouse.up();
  const after = await node.boundingBox();
  check(
    !!after && Math.abs(after.x - before.x) > 20,
    "React Flow nodes are actually draggable",
  );
  await page.getByRole("button", { name: "放大画布" }).click();
  await page.getByRole("button", { name: "缩小画布" }).click();
  const priorPan = await page
    .locator(".react-flow__viewport")
    .getAttribute("style");
  await page.mouse.move(850, 750);
  await page.mouse.wheel(180, 0);
  await page.waitForTimeout(200);
  check(
    (await page.locator(".react-flow__viewport").getAttribute("style")) !==
      priorPan,
    "canvas pans with wheel",
  );
  await page.reload();
  await page.getByTestId("card-shot-01").waitFor();
  check(
    (await page.getByTestId("card-shot-01").innerText()).includes("待审核"),
    "reload restores initial Mock status",
  );
  await page.screenshot({ path: "output/playwright/p0-02-collapsed.png" });
  await page.setViewportSize({ width: 900, height: 760 });
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "900px viewport has no page-level horizontal overflow",
  );
  await page.setViewportSize({ width: 1600, height: 1000 });
  return { passed: checks.length, checks };
}
