import https from "https";
import PaytmChecksum from "./cheksum";

export default (req, res, next) => {
  try {
    const { orderId, amount, custId, email, mig, mky} = req.body;
        if (!orderId || !amount || !custId || !email || !mig|| !mky)
          return res.status(403).json({ message: "All field are required" });
    /* for Staging */
    const cbUrl = `"https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`;
    /* for Production */
    // const cbUrl`https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${orderId)}`,

    const paytmParams = {};
    paytmParams.body = {
      requestType: "Payment",
      mid: mig,
      websiteName: "WEBSTAGING",
      industryType:"Retail",
      orderId: orderId,
      callbackUrl: cbUrl,
      txnAmount: {
        value: Number(amount),
        currency: "INR",
      },
      userInfo: {
        custId: custId,
        email: email,
      },
    };

    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mky).then(
      function (checksum) {
        paytmParams.head = {
          signature: checksum,
        };
        let post_data = JSON.stringify(paytmParams);

        let options = {
          /* for Staging */
          hostname: "securegw-stage.paytm.in",

          /* for Production */
          // hostname: 'securegw.paytm.in',

          port: 443,
          path: `/theia/api/v1/initiateTransaction?mid=${mig}&orderId=${orderId}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };

        let response = "";
        let post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            response = JSON.parse(response);
            console.log("txnToken:", response);

            res.status(200).json({
              data: {
                ...response,
                ...req.body,
                cbUrl: cbUrl,
              },
            });
          });
        });
        post_req.write(post_data);
        post_req.end();
      }
    );
  } catch (error) {
    res
      .status(500)
      .json({ error: error?.message, message: "Something went wrong" });
  }
};
