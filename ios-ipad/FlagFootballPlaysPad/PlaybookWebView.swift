import SwiftUI
import WebKit

struct PlaybookWebView: UIViewRepresentable {
  func makeUIView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.defaultWebpagePreferences.allowsContentJavaScript = true

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.isOpaque = false
    webView.backgroundColor = UIColor(red: 0.93, green: 0.85, blue: 0.71, alpha: 1.0)
    webView.scrollView.backgroundColor = webView.backgroundColor
    webView.scrollView.bounces = false
    webView.scrollView.contentInsetAdjustmentBehavior = .automatic

    if let indexURL = Bundle.main.url(forResource: "index", withExtension: "html") {
      webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
    } else {
      webView.loadHTMLString(
        """
        <html>
          <body style="font-family: -apple-system; background: #eed9b6; color: #132a1e; padding: 24px;">
            <h1>Flag Football Plays</h1>
            <p>The bundled web app could not be found in the app resources.</p>
          </body>
        </html>
        """,
        baseURL: nil
      )
    }

    return webView
  }

  func updateUIView(_ webView: WKWebView, context: Context) {}
}
