package com.departmentofone.fitlog;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // FitLog's own plugins, which aren't npm packages and so aren't registered automatically.
        registerPlugin(RestTimerPlugin.class);
        registerPlugin(IncomingPlugin.class);
        super.onCreate(savedInstanceState);
        IncomingPlugin.receive(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        IncomingPlugin.receive(intent);
    }
}
