// JavaScript code for the TI SensorTag Demo app.

/**
 * Object that holds application data and functions.
 */
var app = {};

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

app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);

	// Called when HTML page has been loaded.
	$(document).ready( function()
	{
		// Adjust canvas size when browser resizes
		$(window).resize(app.respondCanvas);

		// Adjust the canvas size when the document has loaded.
		app.respondCanvas();
	});
};

/**
 * Adjust the canvas dimensions based on its container's dimensions.
 */
app.respondCanvas = function()
{
	var canvas = $('#canvas')
	var container = $(canvas).parent()
	canvas.attr('width', $(container).width() ) // Max width
	// Not used: canvas.attr('height', $(container).height() ) // Max height

	// var canvasGyro = $('#canvasGyro')
	// var container = $(canvasGyro).parent()
	// canvasGyro.attr('width', $(container).width() ) // Max width
	// Not used: canvas.attr('height', $(container).height() ) // Max height
};

app.onDeviceReady = function()
{
	app.showInfo('Activate the SensorTag and tap Start.');
};

app.showInfo = function(info)
{
	document.getElementById('info').innerHTML = info;
};

app.showInfo1 = function(info)
{
	document.getElementById('info1').innerHTML = info;
};

app.showInfo2 = function(info)
{
	document.getElementById('info2').innerHTML = info;
};

app.showInfo3 = function(info)
{
	document.getElementById('info3').innerHTML = info;
};

app.showInfo4 = function(info)
{
	document.getElementById('info4').innerHTML = info;
};

// This will call the initial function
app.onStartButton = function()
{
	app.onStopButton();
	app.startScan();
	app.showInfo('Status: Scanning...');
	app.startConnectTimer();
};

app.onStopButton = function()
{
	// Stop any ongoing scan and close devices.
	app.stopConnectTimer();
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();
	app.showInfo('Status: Stopped.');
};

app.startConnectTimer = function()
{
	// If connection is not made within the timeout
	// period, an error message is shown.
	app.connectTimer = setTimeout(
		function()
		{
			app.showInfo('Status: Scanning... ' +
				'Please press the activate button on the tag.');
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
				app.showInfo('Status: Device found: ' + device.name + '.');
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
	app.showInfo('Connecting...');
	device.connect(
		function(device)
		{
			app.showInfo('Status: Connected - reading SensorTag services...');
			app.readServices(device);
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
	app.showInfo('Status: Starting motion detection notification...');

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
			var ding = document.getElementById("myAudio");

			// app.showInfo('This: ' + dataArray);

			// When user presses the button
			// Base case (nothing pressed) is at 0
			if (dataArray == '2') {

				if(countdown) {
					clearInterval(countdown)
				}
				if (startTime) {
					clearTimeout(startTime)
				}

				var counter = 3;
				app.showInfo(counter);
				var countdown = setInterval(function() {
					counter--;
					app.showInfo(counter);
					if (counter == 0) {
						app.showInfo('GO');
						clearInterval(countdown);
						// Play a sound as feedback
						ding.play();
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
							firstIn++;
							// app.showInfo('Status: Data stream active - accelerometer + gyroscope');
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

									// 14% - 25% range, they are prob not straight even if in bounds

									// TotalAccelX should be by default
									app.showInfo1('X Max: ' + maxAccelValueX);
									app.showInfo2('X Sum: ' + sumAccelValueX);
									// app.showInfo2('Y: ' + trialY.length);
									var ratio = sumAccelValueX / sumAccelValueY;
									var bound = maxAccelValueX/sumAccelValueX * 100;
									app.showInfo(ratio);
									app.showInfo4(bound + '%')

									var acceptableRatio = 1.37;
									// var lowerBound = 24.2;
									var lowerBound = 30.2;

									if (ratio < 0.65 || ratio > 3.4) {
										app.showInfo3('Straight')
									} else if (ratio > 2.0 && bound < 12) {
										app.showInfo3('Straight');
									} else if (ratio <= acceptableRatio && (bound <= lowerBound || bound >= 45)) {
										app.showInfo3('Straight');
									} else if (ratio <= acceptableRatio && bound > lowerBound && bound < 45) {
										app.showInfo3('Not straight, some curved')
									} else if (ratio > acceptableRatio && bound < 45) {
										app.showInfo3('Not straight, some curved')
									} else if (ratio > acceptableRatio && bound >= 45) {
										app.showInfo3('Straight')
									} else {
										app.showInfo3('Straight')
									}

									doSomething();
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

							// TODO: remove -- Wont need this later
							// app.drawDiagram(accelValues);
							// app.drawDiagram(gyroValues);
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

/**
 * Plot diagram of sensor values.
 * Values plotted are expected to be between -1 and 1
 * and in the form of objects with fields x, y, z.
 */
app.drawDiagram = function(values)
{
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	// Add recent values.
	app.dataPoints.push(values);

	// Remove data points that do not fit the canvas.
	if (app.dataPoints.length > canvas.width)
	{
		app.dataPoints.splice(0, (app.dataPoints.length - canvas.width));
	}

	// Value is an accelerometer reading between -1 and 1.
	function calcDiagramY(value)
	{
		// Return Y coordinate for this value.
		var diagramY =
			((value * canvas.height) / 2)
			+ (canvas.height / 2);
		return diagramY;
	}

	function drawLine(axis, color)
	{
		context.strokeStyle = color;
		context.beginPath();
		var lastDiagramY = calcDiagramY(
			app.dataPoints[app.dataPoints.length-1][axis]);
		context.moveTo(0, lastDiagramY);
		var x = 1;
		for (var i = app.dataPoints.length - 2; i >= 0; i--)
		{
			var y = calcDiagramY(app.dataPoints[i][axis]);
			context.lineTo(x, y);
			x++;
		}
		context.stroke();
	}

	// Clear background.
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw lines.
	drawLine('x', '#039BE5'); // blue
	drawLine('y', '#E53935'); // red

	// Care about the z for gyro
	// drawLine('z', '#F57F17'); // orange
};

// Initialize the app.
app.initialize();
