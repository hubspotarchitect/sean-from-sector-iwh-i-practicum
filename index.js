const express = require("express");
const axios = require("axios");
const app = express();
require("dotenv").config();

app.set("view engine", "pug");
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PRIVATE_APP_ACCESS = process.env.HS_TOKEN;
const CUSTOM_OBJECT_TYPE = "2-39766856"; // Replace with your custom object type ID
let customObjectsData = []; // To store fetched custom objects data

// Function to fetch custom objects data if not already fetched
const fetchCustomObjectsData = async () => {
  if (customObjectsData.length === 0) {
    try {
      const custom_objects_url = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?properties=project_name,details,amount`;
      const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        "Content-Type": "application/json",
      };
      const resp = await axios.get(custom_objects_url, { headers });
      customObjectsData = resp.data.results;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch custom objects data");
    }
  }
};

// Route 1 - Homepage to render custom objects data
app.get("/", async (req, res) => {
  try {
    await fetchCustomObjectsData(); // Ensure data is fetched before rendering
    res.render("homepage", {
      title: "Custom Objects | HubSpot APIs",
      data: customObjectsData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route 2 - Form to update custom object data (redirects to update.pug)
app.get("/update-cobj/:id", async (req, res) => {
  const objectId = req.params.id;
  try {
    await fetchCustomObjectsData(); // Ensure data is fetched before finding object
    const objectToUpdate = customObjectsData.find(
      (obj) => obj.properties.hs_object_id === objectId
    );
    if (!objectToUpdate) {
      return res.status(404).send("Object not found");
    }
    res.render("update", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      objectData: objectToUpdate.properties,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route 3 - POST route to update custom object data
app.post("/update-cobj", async (req, res) => {
  const objectId = req.body.id;
  const updateData = {
    properties: {
      project_name: req.body.project_name,
      details: req.body.details,
      amount: req.body.amount,
    },
  };

  const custom_object_url = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}/${objectId}`;
  const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    "Content-Type": "application/json",
  };

  try {
    await axios.patch(custom_object_url, updateData, { headers });
    // Update customObjectsData in-memory to reflect the changes
    const index = customObjectsData.findIndex(
      (obj) => obj.properties.hs_object_id === objectId
    );
    if (index !== -1) {
      customObjectsData[index].properties.project_name = req.body.project_name;
      customObjectsData[index].properties.details = req.body.details;
      customObjectsData[index].properties.amount = req.body.amount;
    }
    res.redirect("/"); // Redirect back to homepage
  } catch (error) {
    console.error(error);
    res.redirect("back"); // Redirect back to the form
  }
});

// Route 4 - Render form to create a new custom object
app.get("/create-cobj", async (req, res) => {
  res.render("create", {
    title: "Create Custom Object | Integrating With HubSpot I Practicum",
  });
});

// Route 5 - POST route to create custom object data
app.post("/create-cobj-req", async (req, res) => {
  const createData = {
    properties: {
      project_name: req.body.project_name,
      details: req.body.details,
      amount: req.body.amount,
    },
  };

  const custom_object_url = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`;
  const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(custom_object_url, createData, {
      headers,
    });
    // Assuming the response contains the newly created object's data
    const newObject = response.data; // This should include the ID and other properties

    // Update customObjectsData in-memory to reflect the changes
    customObjectsData.push(newObject); // Add the new object to the array

    res.redirect("/"); // Redirect back to homepage after successful creation
  } catch (error) {
    console.error(error);
    // Example: Render the create.pug template again with an error message
    res.render("create", {
      title: "Create Custom Object | Integrating With HubSpot I Practicum",
      errorMessage: "Failed to create custom object. Please try again later.",
      // Pass other necessary data back to the form
    });
  }
});

// Localhost
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
