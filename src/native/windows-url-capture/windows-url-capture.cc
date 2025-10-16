#include <napi.h>
#include <windows.h>
#include <UIAutomation.h>
#include <comdef.h>
#include <string>
#include <vector>

class WindowsUrlCapture {
private:
    IUIAutomation* pAutomation;
    bool initialized;

    std::wstring GetBrowserUrl(HWND hwnd) {
        if (!initialized || !pAutomation) {
            return L"";
        }

        try {
            IUIAutomationElement* pRoot = nullptr;
            HRESULT hr = pAutomation->ElementFromHandle(hwnd, &pRoot);
            if (FAILED(hr) || !pRoot) {
                return L"";
            }

            // Search for address bar patterns
            std::vector<std::wstring> addressBarIds = {
                L"Chrome_OmniboxView",  // Chrome
                L"Address and search bar", // Chrome (newer)
                L"urlbar-input",        // Firefox
                L"addressInput"         // Edge (Chromium)
            };

            IUIAutomationCondition* pCondition = nullptr;
            VARIANT varProp;
            varProp.vt = VT_I4;
            varProp.lVal = UIA_EditControlTypeId;

            hr = pAutomation->CreatePropertyCondition(UIA_ControlTypePropertyId, varProp, &pCondition);
            if (FAILED(hr) || !pCondition) {
                pRoot->Release();
                return L"";
            }

            IUIAutomationElementArray* pFound = nullptr;
            hr = pRoot->FindAll(TreeScope_Descendants, pCondition, &pFound);

            if (SUCCEEDED(hr) && pFound) {
                int length = 0;
                pFound->get_Length(&length);

                for (int i = 0; i < length && i < 50; i++) {  // Limit search to prevent slowdown
                    IUIAutomationElement* pElement = nullptr;
                    hr = pFound->GetElement(i, &pElement);

                    if (SUCCEEDED(hr) && pElement) {
                        BSTR automationId = nullptr;
                        pElement->get_CurrentAutomationId(&automationId);

                        if (automationId) {
                            std::wstring id(automationId);
                            SysFreeString(automationId);

                            // Check if this matches any known address bar pattern
                            for (const auto& pattern : addressBarIds) {
                                if (id.find(pattern) != std::wstring::npos) {
                                    VARIANT varValue;
                                    hr = pElement->GetCurrentPropertyValue(UIA_ValueValuePropertyId, &varValue);

                                    if (SUCCEEDED(hr) && varValue.vt == VT_BSTR) {
                                        std::wstring url(varValue.bstrVal);
                                        VariantClear(&varValue);
                                        pElement->Release();
                                        pFound->Release();
                                        pCondition->Release();
                                        pRoot->Release();
                                        return url;
                                    }
                                    VariantClear(&varValue);
                                }
                            }
                        }
                        pElement->Release();
                    }
                }
                pFound->Release();
            }
            pCondition->Release();
            pRoot->Release();
        } catch (...) {
            // Catch any exceptions to prevent crashes
        }

        return L"";
    }

public:
    WindowsUrlCapture() : pAutomation(nullptr), initialized(false) {
        HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
        if (SUCCEEDED(hr) || hr == RPC_E_CHANGED_MODE) {
            hr = CoCreateInstance(CLSID_CUIAutomation, NULL, CLSCTX_INPROC_SERVER, IID_IUIAutomation, (void**)&pAutomation);
            initialized = SUCCEEDED(hr);
        }
    }

    ~WindowsUrlCapture() {
        if (pAutomation) {
            pAutomation->Release();
            pAutomation = nullptr;
        }
        CoUninitialize();
    }

    std::string GetActiveWindowUrl() {
        HWND hwnd = GetForegroundWindow();
        if (!hwnd) {
            return "";
        }

        // Get window class name to check if it's a browser
        wchar_t className[256];
        GetClassNameW(hwnd, className, 256);
        std::wstring classStr(className);

        // Check if it's a known browser window
        bool isBrowser = (classStr.find(L"Chrome") != std::wstring::npos ||
                         classStr.find(L"Mozilla") != std::wstring::npos ||
                         classStr.find(L"Edge") != std::wstring::npos ||
                         classStr.find(L"Brave") != std::wstring::npos);

        if (!isBrowser) {
            return "";
        }

        std::wstring url = GetBrowserUrl(hwnd);

        // Convert wide string to UTF-8
        if (url.empty()) {
            return "";
        }

        int size_needed = WideCharToMultiByte(CP_UTF8, 0, url.c_str(), (int)url.length(), NULL, 0, NULL, NULL);
        std::string strTo(size_needed, 0);
        WideCharToMultiByte(CP_UTF8, 0, url.c_str(), (int)url.length(), &strTo[0], size_needed, NULL, NULL);

        return strTo;
    }
};

// Global instance (reused for performance)
static WindowsUrlCapture* urlCapture = nullptr;

Napi::String GetActiveWindowUrl(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    try {
        if (!urlCapture) {
            urlCapture = new WindowsUrlCapture();
        }

        std::string url = urlCapture->GetActiveWindowUrl();
        return Napi::String::New(env, url);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getActiveWindowUrl"), Napi::Function::New(env, GetActiveWindowUrl));
    return exports;
}

NODE_API_MODULE(windows_url_capture, Init)
