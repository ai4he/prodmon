#include <napi.h>

Napi::String GetActiveWindowUrl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getActiveWindowUrl"), Napi::Function::New(env, GetActiveWindowUrl));
    return exports;
}

NODE_API_MODULE(windows_url_capture, Init)
