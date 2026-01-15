const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
require('chromedriver');

const SITE_URL = 'http://localhost:4200/project';

describe('Project Deletion Flow', function () {
  this.timeout(40000);
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should create a project and then successfully delete it', async function () {
    // --- STEP 1: PREPARATION (Create a generic item to delete) ---
    await driver.get(SITE_URL);

    const uniqueId = new Date().getTime();
    const projectName = `Delete Me ${uniqueId}`;

    // 1. Open Add Dialog
    const addBtn = await driver.wait(
      until.elementLocated(By.id('add-project-btn')), 
      5000
    );
    await addBtn.click();

    // 2. Fill Form
    const dialog = await driver.wait(
        until.elementLocated(By.tagName('app-add-item-dialog')), 
        5000
    );
    const nameInput = await dialog.findElement(By.css('input[formControlName="name"]'));
    await nameInput.sendKeys(projectName);

    // 3. Save
    const submitBtn = await dialog.findElement(By.css('button[color="primary"]'));
    await driver.wait(until.elementIsEnabled(submitBtn), 2000);
    await submitBtn.click();

    // 4. Wait for creation success (so we know it's in the list)
    await driver.wait(
        until.elementLocated(By.tagName('simple-snack-bar')), 
        5000
    );
    await driver.wait(until.stalenessOf(dialog), 5000);
    
    const snackBar = await driver.findElement(By.tagName('simple-snack-bar'));
    await driver.wait(until.stalenessOf(snackBar), 6000); // default duration is usually 3-5s


    // --- STEP 2: DELETION LOGIC ---

    // 5. Find the specific row containing our new project name
    // We use XPath to find the container that holds the specific text
    const rowXPath = `//div[contains(@class, 'row-container')][.//div[contains(@class, 'name')][text()='${projectName}']]`;
    
    const projectRow = await driver.wait(
        until.elementLocated(By.xpath(rowXPath)), 
        5000, 
        `Could not find row with name: ${projectName}`
    );

    // 6. Find the delete button INSIDE that specific row
    const deleteBtn = await projectRow.findElement(By.css('button[color="warn"]'));
    
    // Scroll into view just in case
    await driver.executeScript("arguments[0].scrollIntoView(true);", deleteBtn);
    await deleteBtn.click();

    // 7. Handle the Native Browser Confirm Dialog
    await driver.wait(until.alertIsPresent(), 2000);
    const alert = await driver.switchTo().alert();
    await alert.accept(); // Click "OK"

    // 8. Verify Success Message
    const successToast = await driver.wait(
        until.elementLocated(By.tagName('simple-snack-bar')),
        5000,
        "Delete success toast did not appear"
    );

    const toastText = await successToast.getAttribute('textContent');
    assert.ok(toastText.includes('Project deleted successfully'), 'Toast message mismatch');

    // 9. Verify Item is Removed from List
    try {
        await driver.wait(until.stalenessOf(projectRow), 5000);
    } catch (e) {
        // Fallback check: If the table refreshed, search for the text again
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        assert.ok(!bodyText.includes(projectName), 'Project name should no longer exist in the list');
    }
  });
});