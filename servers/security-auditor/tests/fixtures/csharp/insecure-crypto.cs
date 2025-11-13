// Test fixture: Insecure cryptographic usage

using System.Security.Cryptography;

public class CryptoExamples
{
    // VULNERABLE: MD5 hashing
    public string HashPasswordMD5(string password)
    {
        using (var md5 = MD5.Create())
        {
            var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hash);
        }
    }

    // VULNERABLE: SHA1 hashing
    public string HashPasswordSHA1(string password)
    {
        using (var sha1 = SHA1.Create())
        {
            var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hash);
        }
    }

    // SAFE: SHA256 hashing
    public string HashPasswordSafe(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hash);
        }
    }
}
