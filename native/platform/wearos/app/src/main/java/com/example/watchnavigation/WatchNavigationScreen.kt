package com.example.watchnavigation

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt

@Composable
fun WatchNavigationScreen(bridge: WatchNavigationSensorBridge) {
    val state by bridge.navigationState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.size(152.dp)) {
            drawCircle(color = Color.White.copy(alpha = 0.16f), style = Stroke(width = 6f))
            drawArc(
                color = Color(0xFFFFD84D),
                startAngle = -90f,
                sweepAngle = 260f,
                useCenter = false,
                style = Stroke(width = 8f, cap = StrokeCap.Round),
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${state.distanceMeters.roundToInt()} m",
                color = Color.White,
                fontSize = 30.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "${(state.confidence * 100).roundToInt()}%",
                color = Color.White.copy(alpha = 0.72f),
                fontSize = 12.sp,
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            contentAlignment = Alignment.BottomEnd,
        ) {
            Arrow(state.arrowRotationDegrees)
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 12.dp),
            contentAlignment = Alignment.BottomCenter,
        ) {
            Button(
                onClick = {
                    if (state.anchored) {
                        bridge.reset()
                    } else {
                        bridge.markStartPoint()
                    }
                },
            ) {
                Text(if (state.anchored) "Reset" else "Mark")
            }
        }
    }
}

@Composable
private fun Arrow(rotation: Double) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .background(Color.Transparent, CircleShape)
            .rotate(rotation.toFloat()),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "↑",
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
fun WatchNavigationTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = darkColorScheme()) {
        content()
    }
}
