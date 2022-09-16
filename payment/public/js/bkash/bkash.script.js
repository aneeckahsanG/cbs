function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function customHandler(result) {
    var obj = JSON.parse(result.data);

    if (obj.action === 'closeiFrame') {
        $.ajax({ 
            url: 'cancel', 
            type: 'POST', 
            contentType: 'application/json',
            headers:{
                'ACCESS-KEY': accessKey
            },
            data: JSON.stringify(
                { 
                    "paymentId": paymentId
                }
            ), 
            success: async function(response) { 
                let msg = '';
                if (response && response.code === 0) { 
                    msg = 'Payment canceled.';
                    $('iframe').remove();
                    $('#wait').text(msg);
                    await timeout(3000);
                    window.location.href = redirectUrl +'?paymentId='+paymentId+'&status=cancelled&msg='+msg;
                } else { 
                    msg = response.details;

                    bKash.create().onError();
                    $('iframe').remove();
                    $('#wait').text(msg);
                    await timeout(3000);
                    window.location.href = redirectUrl +'?paymentId='+paymentId+'&status=failed&msg='+msg;
                } 
            }, 
            error: function() { 
                bKash.execute().onError(); 
            } 
        });
    }
}

$(document).ready(function () { 
    bKash.init({ 
        paymentMode: 'checkout', //fixed value ‘checkout’ 
        //paymentRequest format: {amount: AMOUNT, intent: INTENT} 
        //intent options 
        //1) ‘sale’ – immediate transaction (2 API calls) 
        //2) ‘authorization’ – deferred transaction (3 API calls) 
        paymentRequest: { 
            amount: payAmount.toFixed(2), //max two decimal points allowed 
            intent: 'sale' 
        }, 
        createRequest: function(request) { //request object is basically the paymentRequest object, automatically pushed by the script in createRequest method 
            $.ajax({ 
            url: 'create', 
            type: 'POST', 
            contentType: 'application/json',
            headers:{
                'ACCESS-KEY': accessKey
            },
            data: JSON.stringify(
                {
                    paymentId: paymentId
                }
            )
            , 
            success: async function(response) {
                $('#wait').text('');
                if (response && (response.code === 0) && ("paymentID" in response.data[0]) && response.data[0].paymentID != null) { 
                    bKash.create().onSuccess(response.data[0]); //pass the whole response data in bKash.create().onSucess() method as a parameter 
                } else {
                    let msg = '';

                    if("errorMessage" in response.data[0]) {
                        msg = response.data[0].errorMessage;
                    } else {
                        msg = response.details;
                    }

                    bKash.create().onError();
                    $('iframe').remove();
                    $('#wait').text(msg);
                    await timeout(3000);
                    window.location.href = redirectUrl +'?paymentId='+paymentId+'&status=failed&msg='+msg;
                } 
            }, 
            error: function(err) { 
                bKash.create().onError(); 
            } 
            }); 
        },
        executeRequestOnAuthorization: function() { 
            $.ajax({ 
            url: 'execute', 
            type: 'POST', 
            contentType: 'application/json',
            headers:{
                'ACCESS-KEY': accessKey
            },
            data: JSON.stringify(
                { 
                    "paymentId": paymentId
                }
            ), 
            success: async function(response) { 
                let msg = '';
                if (response && (response.code === 0) && ("paymentID" in response.data[0]) && response.data[0].paymentID != null) { 
                    msg = 'Payment completed successfully.';
                    $('iframe').remove();
                    $('#wait').text(msg);
                    await timeout(3000);
                    window.location.href = redirectUrl +'?paymentId='+paymentId+'&status=success&msg='+msg+'&txnAmount='+response.data[0].amount+'&merchantTransactionId='+response.data[0].merchantInvoiceNumber+'&txnResponse=2';
                } else {
                    if("errorMessage" in response.data[0]) {
                        msg = response.data[0].errorMessage;
                    } else {
                        msg = response.details;
                    }
                    
                    bKash.create().onError();
                    $('iframe').remove();
                    $('#wait').text(msg);
                    await timeout(3000);
                    window.location.href = redirectUrl +'?paymentId='+paymentId+'&status=failed&msg='+msg+'&txnAmount='+response.data[0].amount+'&merchantTransactionId='+response.data[0].merchantInvoiceNumber+'&txnResponse=3';
                } 
            }, 
            error: function() { 
                bKash.execute().onError(); 
            } 
            }); 
        } 
    });

    $('iframe').on('load', function(){
        setTimeout(function(){
            $('#bKash_button').trigger('click');
        }, 3000);
    });
});

if (window.addEventListener) {
    window.addEventListener("message", customHandler, false);
} else if (window.attachEvent) {
    window.attachEvent("onmessage", customHandler);
}