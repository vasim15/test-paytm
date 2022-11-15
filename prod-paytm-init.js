import https from "https";
import PaytmChecksum from "./cheksum";

export default (req, res, next) => {
  try {
    const { orderId, amount, custId, email, mig, mky } = req.body;
    if (!orderId || !amount || !custId || !email || !mig || !mky)
      return res.status(403).json({ message: "All field are required" });
    /* for Staging */
    // const cbUrl = `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`;
    /* for Production */
    const cbUrl = `https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`;

    const paytmParams = {};
    paytmParams.body = {
      requestType: "Payment",
      mid: mig,
      websiteName: "DEFAULT",
      industryType: "Retail",
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
        //   hostname: "securegw-stage.paytm.in",

          /* for Production */
          hostname: 'securegw.paytm.in',

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

           return res.status(200).json({
              data: {
                ...response,
                ...req.body,
                cbUrl: cbUrl,
                htmlBody: `<html>
                       <head>
                          <title>Show Payment Page</title>
                       </head>
                       <body>
                          <center>
                             <h1>Please do not refresh this page...</h1>
                          </center>
                          <form method="post" action="https://securegw.paytm.in/theia/api/v1/showPaymentPage?mid=${mig}&orderId=${orderId}" name="paytm">
                             <table border="1">
                                <tbody>
                                    <input type="hidden"  name="mid" value="${mig}">
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
      }
    );
  } catch (error) {
   return res
      .status(500)
      .json({ error: error?.message, message: "Something went wrong" });
  }
};
