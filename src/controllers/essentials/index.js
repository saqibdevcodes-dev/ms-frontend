const db = require("../../database/sql");

async function createEssentials(request, response) {
  try {
    const { essentials } = request.body;

    // Check if essentials array is not empty
    if (!essentials || essentials.length === 0) {
      return response
        .status(400)
        .json({ message: "Essentials array is required and cannot be empty." });
    }

    // Get a connection from the db
    const connection = await db.getConnection();

    try {
      // Prepare the data for insertion
      const essentialsData = essentials.map((item) => [
        item.essential,
        item.essential_key,
      ]);

      // Use INSERT IGNORE to skip duplicates
      const [result] = await connection.query(
        "INSERT IGNORE INTO essentials (essential, essential_key) VALUES ?",
        [essentialsData]
      );

      // 
      const [essentialsResult] = await db.query(
        "SELECT * FROM essentials ORDER BY id DESC"
      );
      // Respond with the result
      return response.status(200).json({
        response: `Inserted ${result.affectedRows} new essentials.`,
        essentials: essentialsResult,
      });
    } finally {
      // Release the connection back to the db
      connection.release();
    }
  } catch (err) {
    // Handle errors and respond with a 500 status code
    return response.status(500).json({ error: err.message });
  }
}

// async function getEssentialsWithPagination(request, response) {
//   try {
//     const { page = 1 } = request.query; // Default to page 1 if not provided
//     const itemsPerPage = 10; // Number of items per page
//     const offset = (page - 1) * itemsPerPage;

//     // Get a connection from the db
//     const connection = await db.getConnection();

//     try {
//       // Query to get paginated results
//       const [rows] = await connection.query(
//         'SELECT * FROM essentials ORDER BY id ASC LIMIT ? OFFSET ?',
//         [itemsPerPage, offset]
//       );

//       // Query to get total count of records
//       const [countResult] = await connection.query(
//         'SELECT COUNT(*) AS total FROM essentials'
//       );
//       const totalItems = countResult[0].total;

//       // Calculate total pages
//       const totalPages = Math.ceil(totalItems / itemsPerPage);

//       // Respond with paginated data and metadata
//       return response.status(200).json({
//         currentPage: parseInt(page, 10),
//         totalPages,
//         totalItems,
//         itemsPerPage,
//         data: rows,
//       });
//     } finally {
//       // Release the connection back to the db
//       connection.release();
//     }
//   } catch (err) {
//     return response.status(500).json({ error: err.message });
//   }
// }

// async function createEssentials(request, response) {
//   try {
//     const { essentials } = request.body;

//     // Prepare array to store new essentials
//     const essentialsData = [];

//     // Loop through each essential to check if it already exists
//     for (const item of essentials) {
//       const { data: existingEssential, error: selectError } = await supabase
//         .from("essentials")
//         .select("id")
//         .eq("essential", item)
//         .single();

//       if (selectError && selectError.code !== "PGRST116") {
//         return response.status(400).json({ response: selectError });
//       }

//       // If the essential doesn't exist, add it to the array for insertion
//       if (!existingEssential) {
//         essentialsData.push({ essential: item });
//       }
//     }

//     // Insert only non-existing essentials
//     if (essentialsData.length > 0) {
//       const { data, error } = await supabase
//         .from("essentials")
//         .insert(essentialsData);

//       if (error) {
//         return response.status(400).json({ response: error });
//       }

//       return response.status(200).json({ response: data });
//     } else {
//       return response
//         .status(200)
//         .json({ message: "All essentials already exist." });
//     }
//   } catch (err) {
//     return response.status(500).json({ error: err });
//   }
// }

async function fetchEssentials(request, response) {
  try {
    // Query the database to fetch all users
    const [essentials] = await db.query(
      "SELECT * FROM essentials ORDER BY id DESC"
    );

    // Send the users as a response
    return response.status(200).json({
      data: essentials,
      message: "All essentials fetched!",
    });
  } catch (error) {
    console.error("Error fetching essentials:", error.message);

    // Handle errors and send an appropriate response
    return response.status(400).json({
      error: error.message,
      message: "Error fetching essentials!",
    });
  }
}

async function deleteEssential(request, response) {
  try {
    const { id } = request.params;

    // Check if ID is provided
    if (!id) {
      return response
        .status(400)
        .json({ message: "Essential ID is required." });
    }

    // Get a connection from the database
    const connection = await db.getConnection();

    try {
      // Delete the essential with the given ID
      const [result] = await connection.query(
        "DELETE FROM essentials WHERE id = ?",
        [id]
      );

      // Check if any row was deleted
      if (result.affectedRows === 0) {
        return response.status(404).json({ message: "Essential not found." });
      }

      return response
        .status(200)
        .json({ message: `Essential with ID ${id} deleted successfully.` });
    } finally {
      // Release the connection back to the database
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting essential:", error.message);
    return response.status(500).json({
      error: error.message,
      message: "Error deleting essential!",
    });
  }
}
const essentialController = {
  createEssentials,
  fetchEssentials,
  deleteEssential,
};

module.exports = essentialController;
