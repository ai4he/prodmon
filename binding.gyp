{
  "targets": [
    {
      "target_name": "windows_url_capture",
      "conditions": [
        ["OS=='win'", {
          "cflags!": [ "-fno-exceptions" ],
          "cflags_cc!": [ "-fno-exceptions" ],
          "sources": [ "src/native/windows-url-capture/windows-url-capture.cc" ],
          "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")"
          ],
          "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          },
          "libraries": [
            "-lole32.lib",
            "-loleaut32.lib"
          ]
        }],
        ["OS!='win'", {
          "sources": [ "src/native/stub.cc" ],
          "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")"
          ],
          "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
        }]
      ]
    }
  ]
}
