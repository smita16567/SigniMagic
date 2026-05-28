import Array "mo:base/Array";
import Buffer "mo:base/Buffer";

actor {
  private var sessions : [[Text]] = [];

  public func saveSession(gestures : [Text]) : async () {
    let buffer = Buffer.fromArray<[Text]>(sessions);
    buffer.add(gestures);
    sessions := Buffer.toArray(buffer);
  };

  public query func getSessions() : async [[Text]] {
    return sessions;
  };

  public query func getSessionCount() : async Nat {
    return sessions.size();
  };

  public func clearSessions() : async () {
    sessions := [];
  };
}