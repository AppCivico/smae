import { Configuration, DefaultApi, MinhaContaApi } from "./generated";

if (!process.env.BASE_PATH) throw new Error("BASE_PATH is required");
if (!process.env.ACCESS_TOKEN) throw new Error("ACCESS_TOKEN is required");

// Configure the API client
const config = new Configuration({
  basePath: process.env.BASE_PATH,
  accessToken: process.env.ACCESS_TOKEN,
});

const api = new MinhaContaApi(config);

// Example function to make a basic request
async function fetchSomeData() {
  try {
    const response = await api.minhaContaControllerGetMe();
    console.log(response.data);

    response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Call the function
fetchSomeData();
