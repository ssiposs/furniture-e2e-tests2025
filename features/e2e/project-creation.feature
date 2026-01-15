@e2e
Feature: Project Creation E2E behaviours

  Background:
    Given the application dev server is running
    And I am on the Project List page

  Scenario: Open dialog and verify initial invalid state
    When I click the "Add New Item" button
    Then the "Add New Item" dialog should be visible
    And the "Create" button should be disabled

  Scenario: Create a new project and verify success
    When I click the "Add New Item" button
    And I enter "E2E Test Project" into the "Name" field
    And I enter "Auto-generated description" into the "Description" field
    And I click the "Create" button
    Then I should see a success notification containing "Project created successfully"
    And the project list should contain "E2E Test Project"