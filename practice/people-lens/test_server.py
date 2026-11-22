import http.client
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from server import MAX_FRAME, make_handler


class TestDetector:
    label = 'Test detector (no inference)'
    def predict(self, payload, confidence):
        if payload != b'test-image':
            raise ValueError('Invalid test image')
        return {'count': 1, 'boxes': [{'xyxy': [0.1, 0.2, 0.4, 0.9], 'confidence': confidence}],
                'processing_ms': 1, 'device': self.label}


class TransportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(TestDetector(), 'test-secret'))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path='/detect', body=b'test-image', headers=None, method='POST'):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port)
        connection.request(method, path, body, headers or {})
        response = connection.getresponse()
        result = response.status, response.read()
        connection.close()
        return result

    def test_pairing_required(self):
        self.assertEqual(self.request()[0], 401)

    def test_detection_response(self):
        code, body = self.request(headers={'X-Pairing-Code': 'test-secret', 'X-Confidence': '0.55'})
        self.assertEqual(code, 200)
        self.assertEqual(json.loads(body)['boxes'][0]['confidence'], 0.55)

    def test_invalid_confidence(self):
        for confidence in ['nan', 'inf', '0', 'garbage', '1']:
            self.assertEqual(self.request(headers={'X-Pairing-Code':'test-secret', 'X-Confidence':confidence})[0], 400)

    def test_oversized_frame(self):
        self.assertEqual(self.request(headers={'X-Pairing-Code':'test-secret', 'Content-Length':str(MAX_FRAME+1)})[0], 413)

    def test_bad_image(self):
        self.assertEqual(self.request(body=b'bad', headers={'X-Pairing-Code':'test-secret'})[0], 400)

    def test_static_allowlist(self):
        self.assertEqual(self.request(path='/server.py', method='GET')[0], 404)
        self.assertEqual(self.request(path='/../.env', method='GET')[0], 404)
        for path in ['/', '/app.js', '/style.css', '/font.woff2', '/health']:
            self.assertEqual(self.request(path=path, method='GET')[0], 200)


if __name__ == '__main__':
    unittest.main()
