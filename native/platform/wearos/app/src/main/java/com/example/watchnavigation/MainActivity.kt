package com.example.watchnavigation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WatchNavigationTheme {
                val context = LocalContext.current
                val bridge = remember { WatchNavigationSensorBridge(context) }
                LaunchedEffect(Unit) {
                    bridge.start()
                }
                DisposableEffect(Unit) {
                    onDispose { bridge.stop() }
                }
                WatchNavigationScreen(bridge = bridge)
            }
        }
    }
}
