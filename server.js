import express from "express";
import cors from "cors";
import paytmInti from "./paytm-init";
import paytmVrfy from "./paytm-vrfy";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get("/", (rq, rs) => rs.json({ message: "good attempt bhai.." }));
app.post("/payment-initiate", paytmInti);
app.post("/payment-verify", paytmVrfy);

app.use((err, req, res, next) => console.log(err));
app.listen(4415, () => {
  console.log(`server running on 4415`);
});
