package com.departmentofone.fitlog;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.text.format.DateFormat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;
import java.util.Date;

/**
 * The rest timer while FitLog is in the background. A foreground service holds a silent "Resting"
 * notification whose countdown Android draws itself (a chronometer counting down to the end), so
 * nothing has to update it every second. A partial wake lock keeps the CPU awake for the length
 * of the rest only, so the end fires on time with the screen off. At the end it posts "Rest over"
 * with sound, vibration and a heads-up popup, unless FitLog is on screen, where the app shows its
 * own "Rest over".
 *
 * Started and changed by RestTimerPlugin (from the app) and by the notification's own +15s and
 * Skip buttons. Every change is reported back to the plugin, so an open app stays in step.
 */
public class RestTimerService extends Service {
    static final String ACTION_START = "com.departmentofone.fitlog.rest.START";
    static final String ACTION_ADD = "com.departmentofone.fitlog.rest.ADD";
    static final String ACTION_SKIP = "com.departmentofone.fitlog.rest.SKIP";
    static final String EXTRA_ENDS_AT = "endsAt";

    private static final String CHANNEL_COUNTDOWN = "rest_countdown";
    private static final String CHANNEL_OVER = "rest_over";
    private static final int ID_COUNTDOWN = 4101;
    private static final int ID_OVER = 4102;
    private static final long ADD_MS = 15_000;
    private static final long[] VIBRATION = {0, 200, 100, 200, 100, 300};

    /** Set by RestTimerPlugin from the activity's resume and pause. */
    static volatile boolean appVisible = false;
    /** The current rest's end (ms since epoch), or 0 when no rest is running. */
    static volatile long currentEndsAt = 0;

    interface Listener {
        void onRestChanged(long endsAt);
    }

    private static Listener listener;

    static void setListener(Listener l) {
        listener = l;
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable finish = this::finishRest;
    private PowerManager.WakeLock wakeLock;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_START.equals(action)) {
            begin(intent.getLongExtra(EXTRA_ENDS_AT, 0));
        } else if (ACTION_ADD.equals(action) && currentEndsAt > 0) {
            begin(Math.max(currentEndsAt, System.currentTimeMillis()) + ADD_MS);
        } else if (ACTION_SKIP.equals(action)) {
            end(false);
        } else if (currentEndsAt == 0) {
            // Restarted by the system with nothing to do.
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void begin(long endsAt) {
        long now = System.currentTimeMillis();
        if (endsAt <= now) {
            end(false);
            return;
        }
        currentEndsAt = endsAt;
        createChannels(this);
        NotificationManagerCompat.from(this).cancel(ID_OVER);
        Notification notification = countdown(endsAt);
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, ID_COUNTDOWN, notification, type);

        acquireWakeLock(endsAt - now + 30_000);
        handler.removeCallbacks(finish);
        handler.postDelayed(finish, endsAt - now);
        notifyListener(endsAt);
    }

    private void finishRest() {
        end(!appVisible);
    }

    /** Ends the rest: stops the countdown and, when asked, alerts that rest is over. */
    private void end(boolean alert) {
        handler.removeCallbacks(finish);
        boolean wasRunning = currentEndsAt > 0;
        currentEndsAt = 0;
        if (alert) {
            postRestOver();
            vibrate();
        }
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        releaseWakeLock();
        if (wasRunning) notifyListener(0);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(finish);
        releaseWakeLock();
        super.onDestroy();
    }

    private void notifyListener(long endsAt) {
        Listener l = listener;
        if (l != null) l.onRestChanged(endsAt);
    }

    private Notification countdown(long endsAt) {
        String until = DateFormat.getTimeFormat(this).format(new Date(endsAt));
        return new NotificationCompat.Builder(this, CHANNEL_COUNTDOWN)
                .setSmallIcon(R.drawable.ic_stat_fitlog)
                .setContentTitle("Resting")
                .setContentText("Rest ends at " + until + ".")
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText("Rest ends at " + until + ".\nYou can turn these notifications off in Settings."))
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setWhen(endsAt)
                .setShowWhen(true)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
                .setContentIntent(openApp(this))
                .addAction(0, "+15s", serviceIntent(ACTION_ADD, 1))
                .addAction(0, "Skip", serviceIntent(ACTION_SKIP, 2))
                .build();
    }

    private void postRestOver() {
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return;
        Notification n = new NotificationCompat.Builder(this, CHANNEL_OVER)
                .setSmallIcon(R.drawable.ic_stat_fitlog)
                .setContentTitle("Rest over")
                .setContentText("Time for your next set.")
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText("Time for your next set.\nYou can turn these notifications off in Settings."))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setVibrate(VIBRATION)
                .setAutoCancel(true)
                // A "Rest over" from ten minutes ago helps nobody.
                .setTimeoutAfter(10 * 60 * 1000)
                .setContentIntent(openApp(this))
                .build();
        try {
            NotificationManagerCompat.from(this).notify(ID_OVER, n);
        } catch (SecurityException e) {
            // Notification permission was taken away mid-rest; the vibration still lands.
        }
    }

    private void vibrate() {
        Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null || !v.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= 26) {
            v.vibrate(VibrationEffect.createWaveform(VIBRATION, -1));
        } else {
            v.vibrate(VIBRATION, -1);
        }
    }

    private void acquireWakeLock(long timeoutMs) {
        releaseWakeLock();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FitLog:RestTimer");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire(timeoutMs);
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }

    private PendingIntent serviceIntent(String action, int requestCode) {
        Intent i = new Intent(this, RestTimerService.class).setAction(action);
        return PendingIntent.getService(this, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent openApp(Context context) {
        Intent i = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void createChannels(Context context) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel countdown = new NotificationChannel(CHANNEL_COUNTDOWN, "Rest countdown", NotificationManager.IMPORTANCE_LOW);
        countdown.setDescription("The countdown while you rest between sets. Silent.");
        countdown.setShowBadge(false);
        countdown.setSound(null, null);
        countdown.enableVibration(false);
        nm.createNotificationChannel(countdown);

        NotificationChannel over = new NotificationChannel(CHANNEL_OVER, "Rest over", NotificationManager.IMPORTANCE_HIGH);
        over.setDescription("Tells you when rest between sets is over.");
        over.enableVibration(true);
        over.setVibrationPattern(VIBRATION);
        nm.createNotificationChannel(over);
    }
}
