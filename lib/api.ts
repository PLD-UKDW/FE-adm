// lib/api.ts
// import axios from "axios";

// const api = axios.create({
//   // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
//     baseURL: process.env.NEXT_PUBLIC_API_URL,
// });

// export default api;


// import axios from "axios";

// console.log("API BASE URL:", process.env.NEXT_PUBLIC_API_URL);

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
// });

// export default api;


// lib/api.ts
import axios from "axios";

const base =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

const api = axios.create({
  baseURL: `${base}/api`,
});

export default api;
