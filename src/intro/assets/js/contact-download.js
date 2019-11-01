$(function () {

	// when the downloadform is submitted
    $('#contactdownload-form').on('submit', function (e) {

        // if the validator does not prevent form submit
        if (!e.isDefaultPrevented()) {
            var url = "assets/php/contact-download.php";

            // POST values in the background the the script URL
            $.ajax({
                type: "POST",
                url: url,
                data: $(this).serialize(),
                success: function (data)
                {
                    // data = JSON object that contact.php returns

                    // we recieve the type of the message: success x danger and apply it to the 
                    var messageAlert = 'alert-' + data.type;
                    var messageText = data.message;

                    // let's compose Bootstrap alert box HTML
                    var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';
                    
                    // If we have messageAlert and messageText
                    if (messageAlert && messageText) {
                        // inject the alert to .messages div in our form
                        $('#contactdownload-form').find('#form-messages').html(alertBox);
                        // empty the form, this may annoy the user
                        //$('#contactdownload-form')[0].reset();
                        // enable the button
  						$('#subButtonDL').prop('disabled', false);
  			            //reset the Google ReCaptcha	
						grecaptcha.reset();

                    }
                }
            });

            //disable the button
  			$('#subButtonDL').prop('disabled', true);

            return false;
        }
    })
});