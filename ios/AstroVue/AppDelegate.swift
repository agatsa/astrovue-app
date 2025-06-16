import ExpoModulesCore
import ExpoModulesReactNativeAdapter

@UIApplicationMain
class AppDelegate: ExpoAppDelegate, ReactNativeFactoryProvider {
  func createReactNativeFactory() -> ReactNativeFactory {
    return AppReactNativeFactory()
  }
}
