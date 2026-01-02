# Smart Garden Monitoring System

Team Members : Kaitlin Gill, Natalia Blanco, Kieran Freitag  

## Project Description

Smart Garden Management System that organizes gardens into monitored sections. Tracks environmental conditions, resource usage, plants, and maintenance logs, while managing ownership and access. Enables gardeners and workers to make informed decisions, optimize plant growth, and efficiently manage garden resources.

--- 

## Queries

| Query Type                        | Description                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Insertion**                     | Adds a new garden with required attributes. Automatically inserts missing location details (postal code, street name, house number) and ensures the owner and postal code exist. |
| **Update**                        | Modifies any non-primary key attributes in the **Plant** table.                                                                                                                  |
| **Deletion**                      | Deletes a selected tool type, removing entries from both **ToolType** and **Tool** tables.                                                                                       |
| **Selection**                     | Retrieves plants from the **Plant** table based on user-specified attributes and logical conditions (AND/OR). Returns only matching rows.                                        |
| **Projection**                    | Shows only selected attributes from the **Garden** table.                                                                                                                        |
| **Join**                          | Combines **PlantType** and **Plant** tables for a user-selected plant type.                                                                                                      |
| **Aggregation (GROUP BY)**        | Counts plants per plant type across all gardens. Returns one row per type in alphabetical order.                                                                                 |
| **Aggregation (HAVING)**          | Calculates total water usage per section by joining **Section**, **Garden**, and **Water** tables. Returns sections using more than 50 liters, sorted from highest to lowest.    |
| **Nested Aggregation (GROUP BY)** | Finds sections with above-average plant-type diversity. Returns section info and garden name/ID.                                                                                 |
| **Division**                      | Finds sections containing **all plant types** in the database. Returns section info and garden name/ID only if no plant type is missing.                                         |

---

<table>
  <tr>
    <td>
      <img
        src="https://github.com/user-attachments/assets/87e7e326-ad27-4aeb-8105-02a1b9a3a852"
        width="89%"
      />
    </td>
    <td>
      <img
        src="https://github.com/user-attachments/assets/e58c187c-2d54-4c8e-8a03-54c8669d1e0f"
        alt="PlotTwist scenario selection"
        width="100%"
      />
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img
        src="https://github.com/user-attachments/assets/ca51934e-0624-4ceb-a3d1-6285b224b9e1"
        width="96%"
      />
    </td>
  </tr>
</table>

---

## Getting Started / Setup Instructions

1. **Initialize the database**  

   Run the SQL script `database_initialization.sql` using SQL*Plus:
   
   ```sql
   @database_initialization.sql

3. **Connect to the database**

   Use your preferred SQL client or command-line tool with the credentials specified in the initialization script.
   
 ---
 
## Notes

This repository contains the CPSC 304 team project and serves as a demonstration of database design, SQL scripting, and user access management for a smart-garden system.
