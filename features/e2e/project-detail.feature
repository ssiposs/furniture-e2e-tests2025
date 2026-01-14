@e2e
Feature: Project Detail Panel E2E behaviours

  Background:
    Given the application dev server is running
    And I am on the Projects page

  # ==========================================
  # Page Load Tests
  # ==========================================
  
  Scenario: Projects page loads and displays the project list
    Then the toolbar should display "Projects"
    And the add project button should be visible
    And the project table should be visible

  # ==========================================
  # Detail Panel Open/Close Tests
  # ==========================================

  Scenario: Open project detail panel by clicking on a project row
    Given there is at least one project in the list
    When I click on the first project row
    Then the detail overlay should appear
    And the detail panel should display the project header
    And the project title should not be empty

  Scenario: Close detail panel by clicking the close button
    Given I have opened a project detail panel
    When I click the close button in the header
    Then the detail overlay should disappear

  Scenario: Close detail panel by clicking on overlay background
    Given I have opened a project detail panel
    When I click on the overlay background outside the panel
    Then the detail overlay should disappear

  # ==========================================
  # Header Tests
  # ==========================================

  Scenario: Detail panel header displays project information
    Given I have opened a project detail panel
    Then the header should display the project ID badge
    And the header should display the version badge
    And the header should display the project title
    And the header should display the project description

  # ==========================================
  # Stats Bar Tests
  # ==========================================

  Scenario: Stats bar displays project statistics
    Given I have opened a project detail panel
    Then the stats bar should be visible
    And the stats bar should display "Created" date
    And the stats bar should display "Updated" date
    And the stats bar should display "Versions" count
    And the stats bar should display "Bodies" count

  # ==========================================
  # Bodies Section Tests
  # ==========================================

  Scenario: Bodies section displays view toggle buttons
    Given I have opened a project detail panel
    Then the view toggle should be visible
    And the view toggle should have 3 buttons (grid, table, visual)
    And the grid view button should be active by default

  Scenario: Toggle to table view in bodies section
    Given I have opened a project detail panel
    When I click the table view button
    Then the table view button should be active
    And the bodies should display in table format if bodies exist

  Scenario: Toggle to visual view in bodies section
    Given I have opened a project detail panel
    When I click the visual view button
    Then the visual view button should be active
    And the bodies should display in visual format if bodies exist

  Scenario: Bodies grid view displays body cards with dimensions
    Given I have opened a project detail panel for a project with bodies
    Then body cards should be displayed in the grid
    And each body card should show index number
    And each body card should show width, height, and depth dimensions

  Scenario: Bodies table view displays correct columns
    Given I have opened a project detail panel for a project with bodies
    When I click the table view button
    Then the bodies table should have columns: #, ID, Width, Height, Depth, Volume

  Scenario: Empty bodies state is shown when no bodies exist
    Given I have opened a project detail panel for a project with no bodies
    Then the empty bodies message should be displayed

  # ==========================================
  # Version History Tests
  # ==========================================

  Scenario: Version history section displays versions
    Given I have opened a project detail panel for a project with versions
    Then the versions section should be visible
    And version items should be displayed
    And the latest version should have the "Latest" badge

  Scenario: Select a different version from history
    Given I have opened a project detail panel for a project with multiple versions
    When I click on the second version in the list
    Then the second version should become active
    And the bodies section should update to show the selected version's bodies

  Scenario: Restore button appears for non-latest versions
    Given I have opened a project detail panel for a project with multiple versions
    When I select a non-latest version
    Then the restore button should be visible for that version

  Scenario: Empty version history state
    Given I have opened a project detail panel for a project with no versions
    Then the empty versions message should be displayed

  # ==========================================
  # Footer Tests
  # ==========================================

  Scenario: Footer displays project status
    Given I have opened a project detail panel
    Then the footer should be visible
    And the project status badge should show "Active" for non-archived projects

  Scenario: Footer displays action buttons
    Given I have opened a project detail panel
    Then the Edit button should be visible
    And the Archive button should be visible
    And the Delete button should be visible

  Scenario: Edit button opens edit dialog
    Given I have opened a project detail panel
    When I click the Edit button in the footer
    Then the edit dialog should open

  # ==========================================
  # Responsive Tests
  # ==========================================

  Scenario: Detail panel is responsive on smaller screens
    Given I have opened a project detail panel
    When the viewport is less than 900px wide
    Then the bodies and versions sections should stack vertically

  # ==========================================
  # Error Handling Tests
  # ==========================================

  Scenario: Error state is displayed when project fails to load
    Given the API returns an error for project details
    When I click on a project row
    Then the error state should be displayed
    And a retry button should be visible

  Scenario: Retry button reloads project details
    Given the error state is displayed
    When I click the retry button
    Then the project details should attempt to reload
