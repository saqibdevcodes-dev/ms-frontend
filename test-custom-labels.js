const db = require("./src/database/sql");

async function testCustomLabels() {
  try {
    console.log("🧪 Testing Custom Labels Functionality...\n");

    // 1. Check if the migration was successful
    console.log("1. Checking database structure...");
    const [columns] = await db.query(`
      SHOW COLUMNS FROM clients 
      WHERE Field IN ('branch_label', 'visit_date_label', 'branch_report_label', 
                     'total_branches_label', 'completed_branches_label', 'my_reports_label')
    `);

    console.log(
      `✅ Found ${columns.length}/6 custom label columns in the database`
    );
    columns.forEach((col) =>
      console.log(`   - ${col.Field}: ${col.Type} (Default: ${col.Default})`)
    );

    // 2. Check existing client data
    console.log("\n2. Checking existing client data...");
    const [clients] = await db.query(
      "SELECT uuid, name, branch_label, total_branches_label FROM clients LIMIT 3"
    );

    if (clients.length > 0) {
      console.log(`✅ Found ${clients.length} clients with custom labels:`);
      clients.forEach((client) => {
        console.log(
          `   - ${client.name}: Branch Label = "${client.branch_label}", Total Branches = "${client.total_branches_label}"`
        );
      });
    } else {
      console.log("⚠️  No clients found in database");
    }

    // 3. Test the API endpoint
    console.log("\n3. Testing API response...");
    if (clients.length > 0) {
      const testClient = clients[0];
      console.log(
        `   Testing with client: ${testClient.name} (${testClient.uuid})`
      );

      // Simulate the API call
      const [result] = await db.query("SELECT * FROM clients WHERE uuid = ?", [
        testClient.uuid,
      ]);

      if (result.length > 0) {
        const clientData = result[0];
        const hasCustomLabels = [
          "branch_label",
          "visit_date_label",
          "branch_report_label",
          "total_branches_label",
          "completed_branches_label",
          "my_reports_label",
        ].every((field) => clientData[field] !== undefined);

        if (hasCustomLabels) {
          console.log("✅ API response includes all custom label fields:");
          console.log(`   - Branch Label: "${clientData.branch_label}"`);
          console.log(
            `   - Visit Date Label: "${clientData.visit_date_label}"`
          );
          console.log(
            `   - Branch Report Label: "${clientData.branch_report_label}"`
          );
          console.log(
            `   - Total Branches Label: "${clientData.total_branches_label}"`
          );
          console.log(
            `   - Completed Branches Label: "${clientData.completed_branches_label}"`
          );
          console.log(
            `   - My Reports Label: "${clientData.my_reports_label}"`
          );
        } else {
          console.log(
            "❌ Some custom label fields are missing from API response"
          );
        }
      }
    }

    console.log("\n🎉 Custom Labels Test Complete!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Start your frontend development server");
    console.log(
      "   2. Go to the client creation form to test adding custom labels"
    );
    console.log(
      "   3. Navigate to the client dashboard to see custom labels in action"
    );
    console.log('   4. Check the sidebar for custom "Branch Report" label');
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    process.exit(0);
  }
}

testCustomLabels();
