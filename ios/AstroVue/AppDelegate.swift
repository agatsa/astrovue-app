import ExpoModulesCore
import UIKit

@UIApplicationMain
class AppDelegate: ExpoAppDelegate, ReactNativeFactoryProvider {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    super.application(application, didFinishLaunchingWithOptions: launchOptions)
    return true
  }

  func createReactNativeFactory() -> ReactNativeFactory {
    return ReactNativeHostFactory.createDefault()
  }
}
