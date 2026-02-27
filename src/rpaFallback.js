export const recoverReadableTextWithRpa = async (page) => {
  // Fallback path: emulate human-like interaction when direct extraction fails.
  await page.mouse.move(200, 220);
  await page.mouse.click(200, 220);
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(300);
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(300);
  await page.keyboard.press("Home");
  await page.waitForTimeout(200);
  const text = (await page.locator("body").innerText()).trim();
  return text;
};
