from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # If the file exists, serve it normally
        if os.path.exists(self.translate_path(self.path)):
            return super().do_GET()
        
        # Otherwise serve index.html (SPA fallback)
        self.path = "/index.html"
        return super().do_GET()

if __name__ == "__main__":
    PORT = 8000
    server = HTTPServer(("localhost", PORT), SPAHandler)
    print(f"Serving SPA on http://localhost:{PORT}")
    server.serve_forever()