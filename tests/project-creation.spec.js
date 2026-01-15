const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
require('chromedriver'); 

const SITE_URL = 'http://localhost:4200/project';

describe('Project Creation Flow', function () {
  // Set timeout to 30s to allow for Angular compilation/loading if needed
  this.timeout(30000); 
  let driver;

  before(async function () {
    // Initialize the browser
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function () {
    // Close the browser after tests
    if (driver) {
      await driver.quit();
    }
  });

  it('should create a new project and verify it in the list', async function () {
    // 1. Navigate to the page
    await driver.get(SITE_URL);

    // Generate a unique project name to prevent test collision
    const uniqueId = new Date().getTime();
    const projectName = `Test Project ${uniqueId}`;
    const projectDesc = `Auto-generated description for ${uniqueId}`;

    // 2. Click the "Add New Item" button
    const addBtn = await driver.wait(
      until.elementLocated(By.css('button.add-project-btn, button[mat-fab], #add-project-btn')), 
      5000,
      "Could not find the Add Project button"
    );
    await addBtn.click();

    // 3. Wait for Dialog to open
    const dialog = await driver.wait(
      until.elementLocated(By.tagName('app-add-item-dialog')),
      5000,
      "Dialog did not open"
    );

    // 4. Validate 'Create' button is disabled (Form Validity Check)
    // Looking for the button inside mat-dialog-actions
    const submitBtn = await driver.findElement(By.css('#create-project-btn'));
    const isEnabledInitial = await submitBtn.isEnabled();
    assert.strictEqual(isEnabledInitial, false, 'Create button should be disabled when form is empty');

    // 5. Fill the Form
    const nameInput = await dialog.findElement(By.css('input[formControlName="name"]'));
    const descInput = await dialog.findElement(By.css('textarea[formControlName="description"]'));

    await nameInput.sendKeys(projectName);
    await descInput.sendKeys(projectDesc);

    // 6. Click Create
    await driver.wait(until.elementIsEnabled(submitBtn), 2000);
    await submitBtn.click();

    // 7. Verify Success Toast (SnackBar)
    const snackBar = await driver.wait(
        until.elementLocated(By.tagName('simple-snack-bar')),
        5000,
        "Snackbar element never appeared in the DOM"
      );
  
      // Second, WAIT until the text is actually visible/present inside it
      // This handles the fade-in animation delay
      await driver.wait(
        until.elementTextContains(snackBar, 'Project created successfully'), 
        5000, 
        "Snackbar appeared, but text 'Project created successfully' was not visible"
      );
  
      // Now safe to log and assert (though the wait above implicitly asserts it)
      const toastText = await snackBar.getText();
      assert.ok(toastText.includes('Project created successfully'), 'Toast message mismatch');

    // 8. Verify Dialog Closed
    await driver.wait(until.stalenessOf(dialog), 5000, "Dialog did not close");

    // 9. Verify Item in List (Table)
    const tableBody = await driver.wait(
        until.elementLocated(By.tagName('tbody')), // or .mat-table
        5000
    );
    
    // Check if the body contains our specific project name
    const bodyText = await tableBody.getText();
    assert.ok(bodyText.includes(projectName), `Newly created project "${projectName}" not found in list`);
  });
});