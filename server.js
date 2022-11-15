import express from "express";
import cors from "cors";
import paytmInti from "./paytm-init";
import paytmVrfy from "./paytm-vrfy";
import prodPaytmInti from "./prod-paytm-init";
import prodPaytmVrfy from "./prod-paytm-vrfy";


const app = express();
const PORT = process.env.PORT || 4415;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get("/", (rq, rs) => rs.json({ message: "good attempt bhai.." }));
app.post("/payment-initiate", paytmInti);
app.post("/payment-verify", paytmVrfy);

app.post("/king-rathode-payment-initiate", prodPaytmInti);
app.post("/king-rathode-payment-verify", prodPaytmVrfy);

app.use((err, req, res, next) => console.log(err));
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
