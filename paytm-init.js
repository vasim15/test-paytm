import https from "https";

import PaytmChecksum from "./cheksum";
import { PAYTM_MIG, PAYTM_MERCHANT_KEY, PAYTM_WEBSITE } from "./config";

export default (req, res, next) => {
  try {
    const { orderId, amount, custId, email } = req.body;
    /* for Staging */
    const cbUrl = `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${String(
      orderId
    )}`;
    /* for Production */
    // const cbUrl`https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${String(
    //   orderId
    // )}`,

    if (!orderId || !amount || !custId || !email)
      return res.status(403).json({ message: "All field are required" });

    const paytmParams = {};
    paytmParams.body = {
      requestType: "Payment",
      mid: PAYTM_MIG,
      websiteName: PAYTM_WEBSITE,
      orderId: String(orderId),
      callbackUrl: cbUrl,
      txnAmount: {
        value: Number(amount),
        currency: "INR",
      },
      userInfo: {
        custId: String(custId),
        email: String(email),
      },
    };

    PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      PAYTM_MERCHANT_KEY
    ).then(function (checksum) {
      paytmParams.head = {
        signature: checksum,
      };
      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: "securegw-stage.paytm.in",

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${PAYTM_MIG}&orderId=${orderId}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });

        post_res.on("end", function () {
          response = JSON.parse(response);
          console.log("txnToken:", response);

          res.status(200).json({
            data: {
              ...response,
              callbackUrl: cbUrl,
              htmlBody: `<html>
                       <head>
                          <title>Show Payment Page</title>
                       </head>
                       <body>
                          <center>
                             <h1>Please do not refresh this page...</h1>
                          </center>
                          <form method="post" action="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${PAYTM_MIG}&orderId=${orderId}" name="paytm">
                             <table border="1">
                                <tbody>
                                    <input type="hidden"  name="mid" value="${PAYTM_MIG}">
                                    <input type="hidden" name="orderId" value="${orderId}">
                                    <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                                </tbody>
                             </table>
                             <script type="text/javascript"> document.paytm.submit(); </script>
                          </form>
                       </body>
                  </html>`,
            },
          });
        });
      });
      post_req.write(post_data);
      post_req.end();
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error?.message, message: "Something went wrong" });
  }
};
