$(document).ready(function () {

	// Ref: http://jqueryvalidation.org/documentation/ 
	$("#contact-form").validate({
		messages: {

			name: {
				required: 'Please enter your name'
			},
			email: {
				required: 'Please enter your email'
			},
			selectpurpose: {
				required: 'Please select contact purpose'
			},
			licensekey: {
				required: 'Please enter your license key'
			},
			message: {
				required: 'Please enter your message'
			}

		}

	});

	//manage the state of the license key field
	var $state = $('#ceselectpurpose'), $licensekey = $('#celicensekey');
	$state.change(function () {
		if ($state.val() == 'support') {
			$licensekey.removeAttr('disabled');
			$licensekey.attr('required', 'required');
		} else {
			$licensekey.attr('disabled', 'disabled').val('');
			$licensekey.removeAttr('required');
		}
	}).trigger('change');

	// when the contact form is submitted
	$('#contact-form').on('submit', function (e) {

		// validations
		if ($("#ceselectpurpose").val() == '') {
			return;
		}

		if ($("#ceselectpurpose").val() == 'support' && $("#celicensekey").val().length == 0) {
			return;
		}
		if ($("#cname").val().length == 0) {
			return;
		}
		if ($("#cemail").val().length == 0) {
			return;
		}
		if ($("#cmessage").val().length == 0) {
			return;
		}

		var url = "assets/php/contact-download.php";

		// POST values in the background the script URL
		$.ajax({
			type: "POST",
			url: url,
			data: $(this).serialize(),
			success: function (data) {
				// data = JSON object that contact.php returns
				// we recieve the type of the message: success x danger and apply it to the 
				var messageAlert = 'alert-' + data.type;
				var messageText = data.message;

				// let's compose Bootstrap alert box HTML
				var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';

				// If we have messageAlert and messageText
				if (messageAlert && messageText) {
					// inject the alert to .messages div in our form
					$('#contact-form').find('#form-messages').html(alertBox);
					// empty the form, this may annoy the user
					//$('#contact-form')[0].reset();
					// enable the button
					$('#subButtonCO').prop('disabled', false);
					//reset the Google ReCaptcha	
					grecaptcha.reset();
				}
			}
		});

		//disable the button
		$('#subButtonCO').prop('disabled', true);

		return false;
	})

});

