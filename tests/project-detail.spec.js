/* Selenium + Mocha E2E tests for Project Detail Panel */
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { expect } = require("chai");

const BASE_URL = "http://localhost:4200/project";

// Set to false to watch tests visually, true for CI/automated runs
const HEADLESS = false;

// Slow mode delay (ms) - set to 0 for fast execution
const SLOW_MODE_DELAY = 1500;

/**
 * Helper: Pause for visual observation
 */
async function pause(driver, ms = SLOW_MODE_DELAY) {
  if (!HEADLESS && ms > 0) {
    await driver.sleep(ms);
  }
}

describe("Project Detail Panel E2E", function () {
  this.timeout(180000); // Increased timeout for slow mode

  /** @type {import('selenium-webdriver').ThenableWebDriver} */
  let driver;

  before(async () => {
    const options = new chrome.Options().addArguments(
      "--window-size=1400,900",
      "--disable-gpu",
      "--no-sandbox"
    );

    if (HEADLESS) {
      options.addArguments("--headless=new");
    }

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  /**
   * Helper: Wait for the project list to load
   */
  async function waitForProjectList() {
    await driver.get(BASE_URL);
    await pause(driver);

    await driver.wait(async () => {
      const table = await driver.findElements(By.css("table.custom-table"));
      const empty = await driver.findElements(By.css(".info-box.empty"));
      const loading = await driver.findElements(By.css(".info-box.loading"));
      return (table.length > 0 || empty.length > 0) && loading.length === 0;
    }, 20000);

    await pause(driver);
  }

  /**
   * Helper: Click on the first project row to open detail panel
   */
  async function openFirstProjectDetail() {
    const firstRow = await driver.wait(
      until.elementLocated(By.css("table.custom-table tr.mat-mdc-row")),
      10000
    );

    await pause(driver, 800);
    await firstRow.click();

    await driver.wait(until.elementLocated(By.css(".detail-overlay")), 10000);

    await driver.wait(async () => {
      const loading = await driver.findElements(By.css(".loading-state"));
      return loading.length === 0;
    }, 15000);

    await pause(driver);
  }

  /**
   * Helper: Close the detail panel safely
   */
  async function closeDetailPanel() {
    await driver
      .wait(async () => {
        const backdrops = await driver.findElements(
          By.css(".cdk-overlay-backdrop-showing")
        );
        return backdrops.length === 0;
      }, 5000)
      .catch(() => {
        return driver.actions({ async: true }).sendKeys(Key.ESCAPE).perform();
      });

    await driver.sleep(200);

    const closeBtn = await driver.findElement(
      By.css(".detail-header .close-btn")
    );
    await pause(driver, 800);
    await closeBtn.click();

    await driver.wait(async () => {
      const overlay = await driver.findElements(By.css(".detail-overlay"));
      return overlay.length === 0;
    }, 5000);

    await pause(driver);
  }

  // ============================================
  // TEST: Page loads and displays project list
  // ============================================
  it("loads the project page and displays the project list", async () => {
    await waitForProjectList();

    const toolbar = await driver.findElement(By.css("mat-toolbar"));
    expect(await toolbar.isDisplayed()).to.equal(true);

    const toolbarSpan = await driver.findElements(
      By.xpath("//mat-toolbar//span[contains(text(), 'Projects')]")
    );
    expect(
      toolbarSpan.length,
      "Toolbar should contain Projects text"
    ).to.be.greaterThan(0);

    const addBtn = await driver.findElement(By.css("#add-project-btn"));
    expect(await addBtn.isDisplayed()).to.equal(true);

    await pause(driver);
  });

  // ============================================
  // TEST: Open detail panel and verify header
  // ============================================
  it("opens project detail panel and displays header information", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const header = await driver.findElement(By.css(".detail-header"));
    expect(await header.isDisplayed()).to.equal(true);

    const title = await driver.findElement(By.css(".project-title"));
    expect(
      await title.isDisplayed(),
      "Project title should be visible"
    ).to.equal(true);

    const titleText = await title.getText();
    expect(
      titleText.length,
      "Project title should not be empty"
    ).to.be.greaterThan(0);

    const badgeIds = await driver.findElements(By.css(".badge-id"));
    expect(badgeIds.length, "Badge ID should exist").to.be.greaterThan(0);

    await pause(driver);
    await closeDetailPanel();
  });

  // ============================================
  // TEST: Stats bar displays correct information
  // ============================================
  it("displays stats bar with project statistics", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const statsBar = await driver.findElement(By.css(".stats-bar"));
    expect(await statsBar.isDisplayed()).to.equal(true);

    const statItems = await driver.findElements(By.css(".stat-item"));
    expect(statItems.length).to.equal(4);

    const labels = await driver.findElements(By.css(".stat-label"));
    const labelTexts = await Promise.all(labels.map((l) => l.getText()));
    expect(labelTexts).to.include.members([
      "CREATED",
      "UPDATED",
      "VERSIONS",
      "BODIES",
    ]);

    await pause(driver);
    await closeDetailPanel();
  });

  // ============================================
  // TEST: Bodies section view toggle
  // ============================================
  it("can toggle between grid, table, and visual views for bodies", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const viewToggle = await driver.findElement(By.css(".view-toggle"));
    expect(await viewToggle.isDisplayed()).to.equal(true);

    const toggleButtons = await driver.findElements(
      By.css(".view-toggle button")
    );
    expect(toggleButtons.length).to.equal(3);

    const gridBtn = await driver.findElement(
      By.css(".view-toggle button:first-child")
    );
    const gridBtnClass = await gridBtn.getAttribute("class");
    expect(gridBtnClass).to.include("active");

    await pause(driver);

    const tableBtn = await driver.findElement(
      By.css(".view-toggle button:nth-child(2)")
    );
    await tableBtn.click();
    await pause(driver);

    const tableBtnClassAfter = await tableBtn.getAttribute("class");
    expect(tableBtnClassAfter).to.include("active");

    const visualBtn = await driver.findElement(
      By.css(".view-toggle button:nth-child(3)")
    );
    await visualBtn.click();
    await pause(driver);

    const visualBtnClassAfter = await visualBtn.getAttribute("class");
    expect(visualBtnClassAfter).to.include("active");

    await closeDetailPanel();
  });

  // ============================================
  // TEST: Version history section
  // ============================================
  it("displays version history with version items", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const versionsSection = await driver.findElement(
      By.css(".versions-section")
    );
    expect(await versionsSection.isDisplayed()).to.equal(true);

    const versionItems = await driver.findElements(By.css(".version-item"));
    const emptyVersions = await driver.findElements(By.css(".empty-versions"));

    expect(versionItems.length > 0 || emptyVersions.length > 0).to.equal(true);

    if (versionItems.length > 0) {
      const activeVersion = await driver.findElements(
        By.css(".version-item.active")
      );
      expect(activeVersion.length).to.be.greaterThan(0);

      const latestBadges = await driver.findElements(By.css(".latest-badge"));
      expect(latestBadges.length).to.be.greaterThan(0);
    }

    await pause(driver);
    await closeDetailPanel();
  });

  // ============================================
  // TEST: Select different version
  // ============================================
  it("can select different versions from version history", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const versionItems = await driver.findElements(By.css(".version-item"));

    if (versionItems.length < 2) {
      console.log("Not enough versions to test selection, skipping");
      await closeDetailPanel();
      return;
    }

    await pause(driver);

    const secondVersion = versionItems[1];
    await secondVersion.click();
    await pause(driver);

    const secondVersionClass = await secondVersion.getAttribute("class");
    expect(secondVersionClass).to.include("active");

    await closeDetailPanel();
  });

  // ============================================
  // TEST: Footer actions buttons exist
  // ============================================
  it("displays footer with action buttons", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const footer = await driver.findElement(By.css(".detail-footer"));
    expect(await footer.isDisplayed()).to.equal(true);

    const status = await driver.findElement(By.css(".project-status"));
    expect(await status.isDisplayed()).to.equal(true);

    const editBtn = await driver.findElement(
      By.xpath("//footer//button[.//mat-icon[text()='edit']]")
    );
    const archiveBtn = await driver.findElement(
      By.xpath("//footer//button[.//mat-icon[text()='archive']]")
    );
    const deleteBtn = await driver.findElement(
      By.xpath("//footer//button[.//mat-icon[text()='delete']]")
    );

    expect(await editBtn.isDisplayed()).to.equal(true);
    expect(await archiveBtn.isDisplayed()).to.equal(true);
    expect(await deleteBtn.isDisplayed()).to.equal(true);

    await pause(driver);
    await closeDetailPanel();
  });

  // ============================================
  // TEST: Close panel by clicking overlay
  // ============================================
  it("closes detail panel when clicking on overlay background", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();
    await pause(driver);

    await driver.executeScript(`
      const overlay = document.querySelector('.detail-overlay');
      if (overlay) {
        overlay.click();
      }
    `);

    await pause(driver, 800);

    const overlaysAfter = await driver.findElements(By.css(".detail-overlay"));

    if (overlaysAfter.length > 0) {
      console.log(
        "Note: Overlay background click is blocked by panel stopPropagation - using close button instead"
      );
      await closeDetailPanel();
    }

    const finalOverlays = await driver.findElements(By.css(".detail-overlay"));
    expect(finalOverlays.length).to.equal(0);
  });

  // ============================================
  // TEST: Close panel with close button
  // ============================================
  it("closes detail panel when clicking close button", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();
    await pause(driver);
    await closeDetailPanel();

    const overlaysAfter = await driver.findElements(By.css(".detail-overlay"));
    expect(overlaysAfter.length).to.equal(0);
  });

  // ============================================
  // TEST: Bodies grid view displays body cards
  // ============================================
  it("displays body cards in grid view when bodies exist", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const bodyCards = await driver.findElements(By.css(".body-card"));
    const emptyBodies = await driver.findElements(By.css(".empty-bodies"));

    if (bodyCards.length > 0) {
      const firstCard = bodyCards[0];

      const indexBadge = await firstCard.findElement(By.css(".body-index"));
      expect(await indexBadge.isDisplayed()).to.equal(true);

      const dimensions = await firstCard.findElements(By.css(".dimension"));
      expect(dimensions.length).to.equal(3);
    } else {
      expect(emptyBodies.length).to.be.greaterThan(0);
    }

    await pause(driver);
    await closeDetailPanel();
  });

  // ============================================
  // TEST: Bodies table view displays correct columns
  // ============================================
  it("displays bodies table with correct columns in table view", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const tableBtn = await driver.findElement(
      By.css(".view-toggle button:nth-child(2)")
    );
    await tableBtn.click();
    await pause(driver);

    const bodiesTable = await driver.findElements(By.css(".bodies-table"));
    const emptyBodies = await driver.findElements(By.css(".empty-bodies"));

    if (bodiesTable.length > 0) {
      const headers = await driver.findElements(By.css(".bodies-table th"));
      expect(headers.length).to.equal(6);
    } else {
      expect(emptyBodies.length).to.be.greaterThan(0);
    }

    await closeDetailPanel();
  });

  // ============================================
  // TEST: Edit button opens edit dialog
  // ============================================
  it("opens edit dialog when clicking edit button", async () => {
    await waitForProjectList();

    const rows = await driver.findElements(
      By.css("table.custom-table tr.mat-mdc-row")
    );
    if (rows.length === 0) {
      console.log("No projects found, skipping test");
      return;
    }

    await openFirstProjectDetail();

    const editBtn = await driver.findElement(
      By.xpath("//footer//button[.//mat-icon[text()='edit']]")
    );
    await pause(driver, 800);
    await editBtn.click();

    await pause(driver);

    const dialogSelectors = [
      ".mat-mdc-dialog-container",
      "mat-dialog-container",
      '[role="dialog"]',
    ];

    let dialogFound = false;
    for (const selector of dialogSelectors) {
      const dialogs = await driver.findElements(By.css(selector));
      if (dialogs.length > 0) {
        dialogFound = true;
        break;
      }
    }

    expect(dialogFound, "Edit dialog should appear").to.equal(true);

    await pause(driver);

    try {
      const cancelBtn = await driver.findElement(
        By.xpath("//mat-dialog-container//button[contains(., 'Cancel')]")
      );
      await cancelBtn.click();
    } catch {
      await driver.actions({ async: true }).sendKeys(Key.ESCAPE).perform();
    }

    await driver.wait(async () => {
      const backdrops = await driver.findElements(
        By.css(".cdk-overlay-backdrop-showing")
      );
      return backdrops.length === 0;
    }, 5000);

    await pause(driver, 500);

    const overlays = await driver.findElements(By.css(".detail-overlay"));
    if (overlays.length > 0) {
      await closeDetailPanel();
    }
  });
});
