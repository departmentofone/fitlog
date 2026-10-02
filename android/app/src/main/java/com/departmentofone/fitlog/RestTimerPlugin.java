package com.departmentofone.fitlog;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * The app's bridge to RestTimerService (src/native/restTimer.ts on the JS side):
 * start(endsAt), stop(), notification permission, and a "changed" event when the notification's
 * +15s or Skip buttons, or the end of the rest, change things while the app is open.
 */
@CapacitorPlugin(
    name = "RestTimer",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class RestTimerPlugin extends Plugin implements RestTimerService.Listener {

    @Override
    public void load() {
        RestTimerService.setListener(this);
        RestTimerService.createChannels(getContext());
    }

    @Override
    protected void handleOnResume() {
        RestTimerService.appVisible = true;
    }

    @Override
    protected void handleOnPause() {
        RestTimerService.appVisible = false;
    }

    @Override
    protected void handleOnDestroy() {
        RestTimerService.setListener(null);
    }

    @Override
    public void onRestChanged(long endsAt) {
        JSObject data = new JSObject();
        if (endsAt > 0) data.put("endsAt", endsAt);
        else data.put("endsAt", JSObject.NULL);
        notifyListeners("changed", data);
    }

    @PluginMethod
    public void start(PluginCall call) {
        Double endsAt = call.getDouble("endsAt");
        if (endsAt == null) {
            call.reject("endsAt is required");
            return;
        }
        Context context = getContext();
        Intent i = new Intent(context, RestTimerService.class)
            .setAction(RestTimerService.ACTION_START)
            .putExtra(RestTimerService.EXTRA_ENDS_AT, endsAt.longValue());
        try {
            ContextCompat.startForegroundService(context, i);
            call.resolve();
        } catch (Exception e) {
            // E.g. Android refusing a foreground service start; the in-app timer still runs.
            call.reject("Couldn't start the rest timer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (RestTimerService.currentEndsAt > 0) {
            Context context = getContext();
            Intent i = new Intent(context, RestTimerService.class).setAction(RestTimerService.ACTION_SKIP);
            try {
                context.startService(i);
            } catch (Exception e) {
                // Not running any more.
            }
        }
        call.resolve();
    }

    /** The rest the service is counting, if any: { endsAt } or { endsAt: null }. */
    @PluginMethod
    public void current(PluginCall call) {
        JSObject data = new JSObject();
        long endsAt = RestTimerService.currentEndsAt;
        if (endsAt > 0) data.put("endsAt", endsAt);
        else data.put("endsAt", JSObject.NULL);
        call.resolve(data);
    }

    @Override
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(permissionResult());
    }

    @Override
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "permissionsCallback");
        } else {
            call.resolve(permissionResult());
        }
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        call.resolve(permissionResult());
    }

    /**
     * Android 13+ asks for notification permission; older versions have it on unless the person
     * turned FitLog's notifications off in system settings.
     */
    private JSObject permissionResult() {
        String state;
        boolean enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        if (Build.VERSION.SDK_INT >= 33) {
            PermissionState s = getPermissionState("notifications");
            if (s == PermissionState.GRANTED) state = enabled ? "granted" : "denied";
            else if (s == PermissionState.DENIED) state = "denied";
            else state = "prompt";
        } else {
            state = enabled ? "granted" : "denied";
        }
        JSObject result = new JSObject();
        result.put("notifications", state);
        return result;
    }

    /** Whether this build can receive pushes: Firebase is set up only when google-services.json was there. */
    @PluginMethod
    public void pushAvailable(PluginCall call) {
        Context context = getContext();
        int id = context.getResources().getIdentifier("google_app_id", "string", context.getPackageName());
        JSObject result = new JSObject();
        result.put("available", id != 0);
        call.resolve(result);
    }
}
