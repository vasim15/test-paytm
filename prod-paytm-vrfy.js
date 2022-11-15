import https from "https";
import PaytmChecksum from "./cheksum";

export default (req, res, next) => {
  try {
    const { mky, mig, orderId } = req.body;
    if (!mky || !mig || !orderId)
      return res.status(403).json({ message: "All field are required" });

    let paytmParams = {};

    paytmParams.body = {
      mid: mig,
      orderId: orderId,
    };

    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mky).then(
      function (checksum) {
        paytmParams.head = {
          signature: checksum,
        };
        let post_data = JSON.stringify(paytmParams);

        let options = {
          /* for Staging */
        //   hostname: "securegw-stage.paytm.in",
          /* for Production */
          hostname: 'securegw.paytm.in',
          port: 443,
          path: "/v3/order/status",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };

        // Set up the request
        let response = "";
        let post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", async function () {
            console.log("Response: ", JSON.parse(response));
            const responseData = await JSON.parse(response);
            console.log(responseData, "responseData");
            if (responseData.body.resultInfo.resultStatus !== "TXN_SUCCESS")
              return res.status(400).json({
                message: "payment unsuccessfull",
                data: response,
              });

           return res
              .status(200)
              .json({ message: "payment successfull", data: response });
          });
        });
        // post the data
        post_req.write(post_data);
        post_req.end();
      }
    );
  } catch (error) {
   return res.status(400).json({
      message: "payment unsuccessfull",
      error: error.message,
    });
  }
};
