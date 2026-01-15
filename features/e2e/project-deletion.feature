@e2e
Feature: Project Deletion E2E behaviours

  Background:
    Given the application dev server is running
    And I am on the Project List page

  Scenario: Delete an existing project successfully
    Given a project named "Project to Delete" exists in the list
    When I click the "Delete" button for the project "Project to Delete"
    And I accept the deletion confirmation dialog
    Then I should see a success notification containing "Project deleted successfully"
    And the project list should not contain "Project to Delete"

  Scenario: Cancel deletion of a project
    Given a project named "Safe Project" exists in the list
    When I click the "Delete" button for the project "Safe Project"
    And I dismiss the deletion confirmation dialog
    Then the project list should still contain "Safe Project"