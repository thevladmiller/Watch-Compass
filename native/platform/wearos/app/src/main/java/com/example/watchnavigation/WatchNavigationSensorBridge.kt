package com.example.watchnavigation

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class WearNavigationState(
    val anchored: Boolean = false,
    val distanceMeters: Double = 0.0,
    val confidence: Double = 0.0,
    val arrowRotationDegrees: Double = 0.0,
)

class WatchNavigationSensorBridge(context: Context) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    private val rotationVector = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    private val state = MutableStateFlow(WearNavigationState())
    val navigationState: StateFlow<WearNavigationState> = state

    private var anchored = false
    private var baselineSteps = -1f
    private var totalSteps = 0f
    private var headingDegrees = 0.0
    private var originHeadingDegrees = 0.0
    private var positionX = 0.0
    private var positionY = 0.0
    private val stepLengthMeters = 0.78

    fun start() {
        stepCounter?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        rotationVector?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    fun stop() {
        sensorManager.unregisterListener(this)
    }

    fun markStartPoint() {
        anchored = true
        baselineSteps = totalSteps
        originHeadingDegrees = headingDegrees
        positionX = 0.0
        positionY = 0.0
        publishState()
    }

    fun reset() {
        anchored = false
        baselineSteps = -1f
        totalSteps = 0f
        originHeadingDegrees = 0.0
        headingDegrees = 0.0
        positionX = 0.0
        positionY = 0.0
        publishState()
    }

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_STEP_COUNTER -> handleStepCounter(event)
            Sensor.TYPE_ROTATION_VECTOR -> handleRotationVector(event)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun handleStepCounter(event: SensorEvent) {
        totalSteps = event.values.firstOrNull() ?: totalSteps
        if (!anchored || baselineSteps < 0f) {
            publishState()
            return
        }

        val stepDelta = (totalSteps - baselineSteps).coerceAtLeast(0f)
        val correctedHeading = normalizeDegrees(headingDegrees - shortestAngleDelta(originHeadingDegrees, headingDegrees) * 0.35)
        val radians = Math.toRadians(correctedHeading)
        positionX = kotlin.math.sin(radians) * stepLengthMeters * stepDelta.toDouble()
        positionY = -kotlin.math.cos(radians) * stepLengthMeters * stepDelta.toDouble()
        publishState()
    }

    private fun handleRotationVector(event: SensorEvent) {
        val rotationMatrix = FloatArray(9)
        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
        val orientation = FloatArray(3)
        SensorManager.getOrientation(rotationMatrix, orientation)
        val azimuth = Math.toDegrees(orientation[0].toDouble())
        headingDegrees = if (azimuth < 0) azimuth + 360 else azimuth
        publishState()
    }

    private fun publishState() {
        val distance = kotlin.math.sqrt(positionX * positionX + positionY * positionY)
        val bearing = if (anchored) {
            val dx = -positionX
            val dy = -positionY
            val angle = Math.toDegrees(kotlin.math.atan2(dx, -dy))
            if (angle < 0) angle + 360 else angle
        } else {
            0.0
        }
        state.value = WearNavigationState(
            anchored = anchored,
            distanceMeters = distance,
            confidence = if (anchored) (1.0 - (distance * 0.06)).coerceIn(0.0, 1.0) else 0.0,
            arrowRotationDegrees = bearing,
        )
    }

    private fun shortestAngleDelta(from: Double, to: Double): Double {
        val delta = normalizeDegrees(to) - normalizeDegrees(from)
        return when {
            delta > 180 -> delta - 360
            delta < -180 -> delta + 360
            else -> delta
        }
    }

    private fun normalizeDegrees(value: Double): Double {
        var normalized = value % 360
        if (normalized < 0) {
            normalized += 360
        }
        return normalized
    }
}
