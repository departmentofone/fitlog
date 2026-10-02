package com.departmentofone.fitlog;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Text shared into FitLog from another app's share sheet (a recipe link, "2 eggs, 100g rice"), as
 * the website's share_target does on the web. MainActivity keeps the latest one here; the page
 * takes it at startup (src/native/links.ts) or hears about it while open ("shared").
 */
@CapacitorPlugin(name = "Incoming")
public class IncomingPlugin extends Plugin {
    private static String pendingText;
    private static IncomingPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) instance = null;
    }

    /** Called by MainActivity with every intent it receives. */
    static void receive(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return;
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        String joined = subject != null && text != null && !text.contains(subject) ? subject + " - " + text : text != null ? text : subject;
        if (joined == null || joined.trim().isEmpty()) return;
        pendingText = joined.trim();
        IncomingPlugin p = instance;
        if (p != null) {
            JSObject data = new JSObject();
            data.put("text", pendingText);
            p.notifyListeners("shared", data);
        }
    }

    @PluginMethod
    public void takeSharedText(PluginCall call) {
        JSObject result = new JSObject();
        result.put("text", pendingText != null ? pendingText : JSObject.NULL);
        pendingText = null;
        call.resolve(result);
    }
}
