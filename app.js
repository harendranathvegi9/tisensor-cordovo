// JavaScript code for the TI SensorTag Demo app.

/**
 * Object that holds application data and functions.
 */
var app = {};


// Global scores
var set = 1;
var score = 0;
var straight = 0;
var curved = 0;

/**
 * Data that is plotted on the canvas.
 */
app.dataPoints = [];

/**
 * Timeout (ms) after which a message is shown if the SensorTag wasn't found.
 */
app.CONNECT_TIMEOUT = 3000;

/**
 * Object that holds SensorTag UUIDs.
 */
app.sensortag = {};

// DO NOT TOUCH!
// UUIDs for movement services and characteristics.
app.sensortag.MOVEMENT_SERVICE = 'f000aa80-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_DATA = 'f000aa81-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_CONFIG = 'f000aa82-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_PERIOD = 'f000aa83-0451-4000-b000-000000000000';
app.sensortag.MOVEMENT_NOTIFICATION = '00002902-0000-1000-8000-00805f9b34fb';

// uuid for keypress - Custom Config - Kenny
app.sensortag.KEYPRESS_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
app.sensortag.KEYPRESS_DATA = '0000ffe1-0000-1000-8000-00805f9b34fb';

/**
 * Initialise the application.
 */

function getResults() {

	$(".main-page").hide();
	$(".final-page").show();

	var totalShots = curved + straight;
	var percentageIn = Math.floor(straight / totalShots * 100) || 0;

	$("#straight-shots").html(straight);
	$("#curved-shots").html(curved);
	$("#num-sets").html(set);
	$("#shots-made").html(totalShots);
	$("#percentage").html(percentageIn + "%")

	var tips = [
		"Make sure you are as low to the table as possible",
		"Make sure you follow through with your shot",
		"Do not rotate your wrists while making your shot",
		"Keep your shooting elbow in one spot, and only bend your elbow during the shot"
	];

	var numberOfTips = getRandomArbitrary(1, tips.length);

	$('.tips-list').html(setTipsHTML);

	function getRandomArbitrary(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	function setTipsHTML () {
		var tipsToShow = "";

		for (var i = 0; i < numberOfTips; i++ ){
		tipsToShow += '<li class="tip">'+ tips[i] +'</li>'
		}

		return tipsToShow;
	}
}

function backMainPage() {
	$(".main-page").show();
	$(".final-page").hide();
}

app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);
};

app.onDeviceReady = function()
{
	app.onStartButton();
};

app.showInfo = function(info)
{
	document.getElementById('message').innerHTML = info;
};

app.showInfoCounter = function(info)
{
	document.getElementById('message').innerHTML = '<div class="message-text">' + info + '</div>';
};

app.showInfoResult = function(info)
{
	document.getElementById('message').innerHTML = '<div class="message-text" style="font-size: 65px">' + info + '</div>';
};

// This will call the initial function
app.onStartButton = function()
{
	app.onStopButton();
	app.startScan();
	// app.showInfo('Status: Scanning...');
	app.startConnectTimer();
};

app.onStopButton = function()
{
	// Stop any ongoing scan and close devices.
	app.stopConnectTimer();
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();
	// app.showInfo('Status: Stopped.');
};

app.getResultsButton = function() {
	app.onStopButton();
	getResults();
}

app.backMainPageButton = function() {
	backMainPage();
	app.onStartButton();
}

app.startConnectTimer = function()
{
	// If connection is not made within the timeout
	// period, an error message is shown.
	app.connectTimer = setTimeout(
		function()
		{
			// app.showInfo('Status: Scanning... ' +
			// 	'Please press the activate button on the tag.');
		},
		app.CONNECT_TIMEOUT)
}

app.stopConnectTimer = function()
{
	clearTimeout(app.connectTimer);
}

app.startScan = function()
{
	evothings.easyble.reportDeviceOnce(true);
	evothings.easyble.startScan(
		function(device)
		{
			// Connect if we have found a sensor tag.
			if (app.deviceIsSensorTag(device))
			{
				// app.showInfo('Status: Device found: ' + device.name + '.');
				evothings.easyble.stopScan();
				app.connectToDevice(device);
				app.stopConnectTimer();
			}
		},
		function(errorCode)
		{
			app.showInfo('Error: startScan: ' + errorCode + '.');
		});
};

app.deviceIsSensorTag = function(device)
{
	console.log('device name: ' + device.name);
	return (device != null) &&
		(device.name != null) &&
		(device.name.indexOf('Sensor Tag') > -1 ||
			device.name.indexOf('SensorTag') > -1);
};

/**
 * Read services for a device.
 */
app.connectToDevice = function(device)
{
	// app.showInfo('Connecting...');
	device.connect(
		function(device)
		{
			// app.showInfo('Status: Connected - reading SensorTag services...');
			app.readServices(device);
			$(".num-straight").html("0");
			$(".num-curved").html("0");
		},
		function(errorCode)
		{
			app.showInfo('Connection error: ' + errorCode);
		});
};

app.readServices = function(device)
{
	device.readServices(
		[
		app.sensortag.MOVEMENT_SERVICE, // Movement service UUID.
		app.sensortag.KEYPRESS_SERVICE, // Keypress service UUID
		],
		// Function that monitors accelerometer data.
		app.startNotificationSettings,
		function(errorCode)
		{
			console.log('Error: Failed to read services: ' + errorCode + '.');
		});
};

/**
 * Read accelerometer data.
 */
app.startNotificationSettings = function(device)
{
	// app.showInfo('Status: Starting motion detection notification...');

	// Set accelerometer configuration to ON.
	// magnetometer on: 64 (1000000) (seems to not work in ST2 FW 0.89)
	// 3-axis acc. on: 56 (0111000)
	// 3-axis gyro on: 7 (0000111)
	// 3-axis acc. + 3-axis gyro on: 63 (0111111)
	// 3-axis acc. + 3-axis gyro + magnetometer on: 127 (1111111)

	// Only change if you want other sensors. This will be using 63
	device.writeCharacteristic(
		app.sensortag.MOVEMENT_CONFIG,

		// Only need to use gyro + accel
		new Uint8Array([63,0]),
		function()
		{
			console.log('Status: writeCharacteristic ok.');
		},
		function(errorCode)
		{
			console.log('Error: writeCharacteristic: ' + errorCode + '.');
		});

	// Set sensor return period to 100 ms.
	device.writeCharacteristic(
		app.sensortag.MOVEMENT_PERIOD,

		// UInt8Array will give the fastest poll rate
		new Uint8Array([10]),
		function()
		{
			console.log('Status: writeCharacteristic ok.');
		},
		function(errorCode)
		{
			console.log('Error: writeCharacteristic: ' + errorCode + '.');
		});

	// Set sensor notification to ON.
	device.writeDescriptor(
		app.sensortag.MOVEMENT_DATA,
		app.sensortag.MOVEMENT_NOTIFICATION, // Notification descriptor UUID.
		new Uint8Array([1,0]),
		function()
        {
			console.log('Status: writeDescriptor ok.');
		},
		function(errorCode)
		{
			console.log('Error: writeDescriptor: ' + errorCode + '.');
		});

	// Somehow able to read the keypressed data.
	// Power button = "2"
	device.enableNotification(
		app.sensortag.KEYPRESS_DATA,
		function(data)
		{
			var timeDelayStart = 3500;
			var dataArray = new Uint8Array(data);
			var startDing = document.getElementById("myAudio");
			var shootDing = document.getElementById("myAudio2");

			// app.showInfo('This: ' + dataArray);

			// When user presses the button
			// Base case (nothing pressed) is at 0
			if (dataArray == '2') {
				startDing.play();
				$("#start-message-container").hide();
				$("#message-container").show();

				if(countdown) {
					clearInterval(countdown)
				}
				if (startTime) {
					clearTimeout(startTime)
				}

				var counter = 3;
				app.showInfoCounter(counter);
				var countdown = setInterval(function() {
					counter--;
					app.showInfoCounter(counter);
					if (counter == 0) {
						app.showInfoResult('Shoot');
						clearInterval(countdown);
						// Play a sound as feedback
						shootDing.play();
					}
				}, 1000)

				// Give users 3 seconds after button push to set up
				var startTime = setTimeout(function() {

					// Start accelerometer + gyroscope notification.
					var firstIn = 0;
					// If one value dictates, that means that it was prob straight
					var totalAccelX = [],
						totalAccelY = [];

					// Start Enable Notifications
					device.enableNotification(
						app.sensortag.MOVEMENT_DATA,
						function(data)
						{
							// First in just means this is their first time in this function
							firstIn++;
							var dataArray = new Uint8Array(data);
							var values = app.getAccelGyroscopeValues(dataArray);

							// capture values in a setTimeout here for a returned array

							// Stop the connection value with: app.onStopButton()

							// count == 16 data points after 1.5 seconds
							// Need firstIn because you do not want an instance of setTimeout
							// everytime sensor motion data is called (they are called at 10ms polling intervals)
							if (firstIn <= 1) {
								var timer = setTimeout(function(){

									// Logic for calc with accel
									var accelArrayX = totalAccelX;
									var accelArrayY = totalAccelY;

									var maxAccelValueX = Math.max(...accelArrayX);
									var sumAccelValueX = accelArrayX.reduce((a, b) => a + b, 0);
									var sumAccelValueY = accelArrayY.reduce((a, b) => a + b, 0);

									// TotalAccelX should be by default
									// app.showInfo1('X Max: ' + maxAccelValueX);
									// app.showInfo2('X Sum: ' + sumAccelValueX);
									var ratio = sumAccelValueX / sumAccelValueY;
									var bound = maxAccelValueX/sumAccelValueX * 100;
									// app.showInfo(ratio);
									// app.showInfo4(bound + '%')

									var acceptableRatio = 1.37;
									// var lowerBound = 24.2;
									var lowerBound = 30.2;

									score++;
									if (score > 10) {
										set++;
										score = 1;
										for (var x = 1; x <= 10; x++) {
											$("#circle" + x + " img").attr('src', 'libs/assets/free_shot.svg')
										}
										$(".set-text").html('SET ' + set);
									}
									// Ratio is extremely high if user shoots straight but
									// they are moving very slowly (or not moving)
									// If ratio is less than 0.65, that means Y acceleration >> X acceleration
									// Basically means they are straight in most cases
									if (ratio < 0.65 || ratio > 3.4) {
										app.showInfoResult('Straight')
										straight++;
										$("#circle" + score + " img").attr('src', 'libs/assets/straight_shot.svg')
									} else if (ratio > 2.0 && bound < 12) {
										// Edge case for slow movements but straight
										app.showInfoResult('Straight');
										straight++;
										$("#circle" + score + " img").attr('src', 'libs/assets/straight_shot.svg')
									} else if (ratio <= acceptableRatio && (bound <= lowerBound || bound >= 45)) {
										app.showInfoResult('Straight');
										straight++;
										$("#circle" + score + " img").attr('src', 'libs/assets/straight_shot.svg')
									} else if (ratio <= acceptableRatio && bound > lowerBound && bound < 45) {
										app.showInfoResult('Curved')
										curved++;
										$("#circle" + score + " img").attr('src', 'libs/assets/curved_shot.svg')
									} else if (ratio > acceptableRatio && bound < 45) {
										app.showInfoResult('Curved')
										curved++;
										$("#circle" + score + " img").attr('src', 'libs/assets/curved_shot.svg')
									} else if (ratio > acceptableRatio && bound >= 45) {
										app.showInfoResult('Straight')
										straight++;
										$("#circle" + score + " img").attr('src', 'libs/assets/straight_shot.svg')
									} else {
										app.showInfoResult('Curved')
										$("#circle" + score + " img").attr('src', 'libs/assets/curved_shot.svg')
										curved++;
									}

									$(".num-straight").html(straight);
									$(".num-curved").html(curved);

									clearTimeout(timer);

								}, 1500);
							}

							var gyroValues = values[0];
							var accelValues = values[1];

							// Scale by 10 so you arent dealing with fractions on the total
							totalAccelX.push(Math.abs(accelValues.x * 10));


							// Y is the direction of the shot
							// totalAccelY+= Math.abs(accelValues.y * 10);
							totalAccelY.push(Math.abs(accelValues.y * 10));
						},
						function(errorCode)
						{
							console.log('Error: enableNotification: ' + errorCode + '.');
						}
					);
					// End Enable Notifications
					clearTimeout(startTime)
				}, timeDelayStart);
			}
		},
		function(errorCode)
		{
			console.log('Error: enableNotification: ' + errorCode + '.');
		});
};

/**
 * Calculate gyroscope and accelerometer values from raw data for SensorTag
 * @param data - an Uint8Array.
 * @return Object with fields: x, y, z.
 */
app.getAccelGyroscopeValues = function(data)
{
	// Divisor for Accelerometer values
	var divisors = { x: -5000.0, y: 16384.0, z: -16384.0 };

	// Calculate Gyroscope values.
	// Not using at the moment but added it just in case for future
	var gx = evothings.util.littleEndianToInt16(data, 0) * 255.0 / 32768.0 / 260
	var gy = evothings.util.littleEndianToInt16(data, 2) * 255.0 / 32768.0 / 260
	var gz =  evothings.util.littleEndianToInt16(data, 4) * 255.0 / 32768.0 / 260

	// Calculate accelerometer values.
	var ax = evothings.util.littleEndianToInt16(data, 6) / divisors.x
	var ay = evothings.util.littleEndianToInt16(data, 8) / divisors.y
	var az = evothings.util.littleEndianToInt16(data, 10) / divisors.z

	// Return result.
	var gyroscopeData ={ x: gx, y: gy, z: gz };
	var accelerometerData ={ x: ax, y: ay, z: az };

	var sensorDataArray = [gyroscopeData, accelerometerData]

	// sensorDataArray[0] shows Gyroscope values
	// sensorDataArray[1] shows Accelerometer values
	// app.showInfo(sensorDataArray[0].y);
	return sensorDataArray;
};

// Initialize the app.
app.initialize();
