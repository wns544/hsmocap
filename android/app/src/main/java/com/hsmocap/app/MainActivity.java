package com.hsmocap.app;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    private static final String APP_URL = "https://hsmocap-d907e.web.app";

    private View loadingOverlay;
    private View offlineOverlay;
    private long lastBackPressedAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        attachStateOverlays();
        configureBackNavigation();
        configureWebViewExperience();
    }

    private void attachStateOverlays() {
        ViewGroup root = findViewById(android.R.id.content);
        if (root == null) {
            return;
        }

        loadingOverlay = createLoadingOverlay();
        offlineOverlay = createOfflineOverlay();
        offlineOverlay.setVisibility(View.GONE);

        root.addView(
            loadingOverlay,
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );
        root.addView(
            offlineOverlay,
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );

        if (!isNetworkAvailable()) {
            showOfflineOverlay();
        }
    }

    private void configureBackNavigation() {
        getOnBackPressedDispatcher()
            .addCallback(
                this,
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        if (offlineOverlay != null && offlineOverlay.getVisibility() == View.VISIBLE) {
                            retryLoading();
                            return;
                        }

                        Bridge bridge = getBridge();
                        WebView webView = bridge != null ? bridge.getWebView() : null;

                        if (webView != null && webView.canGoBack()) {
                            webView.goBack();
                            return;
                        }

                        long now = System.currentTimeMillis();
                        if (now - lastBackPressedAt < 2000) {
                            moveTaskToBack(true);
                            finish();
                            return;
                        }

                        lastBackPressedAt = now;
                        Toast.makeText(
                            MainActivity.this,
                            getString(R.string.back_press_exit),
                            Toast.LENGTH_SHORT
                        )
                            .show();
                    }
                }
            );
    }

    private void configureWebViewExperience() {
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        webView.setBackgroundColor(Color.WHITE);

        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageStarted(WebView webView) {
                    runOnUiThread(() -> showLoadingOverlay());
                }

                @Override
                public void onPageCommitVisible(WebView view, String url) {
                    runOnUiThread(() -> hideTransientOverlays());
                }

                @Override
                public void onReceivedError(WebView webView) {
                    runOnUiThread(() -> handlePageLoadFailure());
                }

                @Override
                public void onReceivedHttpError(WebView webView) {
                    runOnUiThread(() -> handlePageLoadFailure());
                }
            }
        );
    }

    private void handlePageLoadFailure() {
        if (isNetworkAvailable()) {
            return;
        }
        showOfflineOverlay();
    }

    private void retryLoading() {
        Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }

        hideOfflineOverlay();
        showLoadingOverlay();
        bridge.getWebView().loadUrl(APP_URL);
    }

    private View createLoadingOverlay() {
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setGravity(Gravity.CENTER);
        container.setBackgroundColor(Color.WHITE);
        container.setClickable(true);

        ProgressBar progressBar = new ProgressBar(this);
        container.addView(progressBar);

        TextView title = new TextView(this);
        title.setText(R.string.loading_title);
        title.setTextColor(Color.parseColor("#111827"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setPadding(0, dp(18), 0, dp(8));
        title.setGravity(Gravity.CENTER);
        container.addView(title);

        TextView message = new TextView(this);
        message.setText(R.string.loading_message);
        message.setTextColor(Color.parseColor("#6B7280"));
        message.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        message.setGravity(Gravity.CENTER);
        container.addView(message);

        return container;
    }

    private View createOfflineOverlay() {
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setGravity(Gravity.CENTER);
        container.setBackgroundColor(Color.WHITE);
        container.setPadding(dp(24), dp(24), dp(24), dp(24));
        container.setClickable(true);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundColor(Color.parseColor("#F9FAFB"));
        card.setPadding(dp(24), dp(24), dp(24), dp(24));

        TextView title = new TextView(this);
        title.setText(R.string.offline_title);
        title.setTextColor(Color.parseColor("#111827"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        card.addView(title);

        TextView message = new TextView(this);
        message.setText(R.string.offline_message);
        message.setTextColor(Color.parseColor("#4B5563"));
        message.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        message.setPadding(0, dp(12), 0, dp(20));
        message.setGravity(Gravity.CENTER);
        card.addView(message);

        Button retryButton = new Button(this);
        retryButton.setText(R.string.retry_button);
        retryButton.setAllCaps(false);
        retryButton.setTextColor(Color.WHITE);
        retryButton.setBackgroundColor(Color.parseColor("#10B981"));
        retryButton.setOnClickListener(v -> retryLoading());

        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        retryButton.setLayoutParams(buttonParams);
        card.addView(retryButton);

        FrameLayout cardWrapper = new FrameLayout(this);
        FrameLayout.LayoutParams cardParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        cardWrapper.addView(card, cardParams);
        container.addView(cardWrapper, cardParams);

        return container;
    }

    private void showLoadingOverlay() {
        if (loadingOverlay != null) {
            loadingOverlay.setVisibility(View.VISIBLE);
            loadingOverlay.bringToFront();
        }
    }

    private void hideLoadingOverlay() {
        if (loadingOverlay != null) {
            loadingOverlay.setVisibility(View.GONE);
        }
    }

    private void showOfflineOverlay() {
        hideLoadingOverlay();
        if (offlineOverlay != null) {
            offlineOverlay.setVisibility(View.VISIBLE);
            offlineOverlay.bringToFront();
        }
    }

    private void hideOfflineOverlay() {
        if (offlineOverlay != null) {
            offlineOverlay.setVisibility(View.GONE);
        }
    }

    private void hideTransientOverlays() {
        hideLoadingOverlay();
        hideOfflineOverlay();
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager == null) {
            return false;
        }

        Network activeNetwork = connectivityManager.getActiveNetwork();
        if (activeNetwork == null) {
            return false;
        }

        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(activeNetwork);
        return capabilities != null &&
            (
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
            );
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value,
            getResources().getDisplayMetrics()
        );
    }
}
