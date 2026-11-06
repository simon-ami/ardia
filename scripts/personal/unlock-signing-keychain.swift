import Foundation
import Security

func check(_ status: OSStatus, _ operation: String) throws {
    guard status == errSecSuccess else {
        let message = SecCopyErrorMessageString(status, nil) as String? ?? String(status)
        throw NSError(domain: "ArdiaPersonalSigning", code: Int(status), userInfo: [NSLocalizedDescriptionKey: "\(operation): \(message)"])
    }
}

func run() throws {
    guard (2...3).contains(CommandLine.arguments.count) else {
        throw NSError(domain: "Usage: unlock-signing-keychain KEYCHAIN [PASSWORD_FILE]", code: 1)
    }
    try check(SecKeychainSetUserInteractionAllowed(false), "Disable interactive keychain prompts")
    var keychain: SecKeychain?
    try check(SecKeychainOpen(CommandLine.arguments[1], &keychain), "Open signing keychain")
    guard let keychain else { throw NSError(domain: "Missing signing keychain", code: 1) }
    var status: SecKeychainStatus = 0
    try check(SecKeychainGetStatus(keychain, &status), "Read signing keychain status")
    if status & UInt32(kSecUnlockStateStatus) != 0 { return }
    guard CommandLine.arguments.count == 3 else {
        throw NSError(domain: "Signing keychain is locked; supply --password-file through the private secret tool", code: 1)
    }
    var password = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))
    defer { password.resetBytes(in: 0..<password.count) }
    let result = password.withUnsafeBytes { bytes in
        SecKeychainUnlock(keychain, UInt32(bytes.count), bytes.baseAddress, true)
    }
    try check(result, "Unlock signing keychain")
}

do { try run() } catch { fputs("\(error.localizedDescription)\n", stderr); exit(1) }
