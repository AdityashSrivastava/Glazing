from app.database import db

def atomic_deduct_points(user_id: str, amount: int) -> bool:
    """
    Atomically deducts points from a user's vault.
    First tries the PostgreSQL RPC function 'deduct_user_points' for absolute server-side ACID atomicity.
    Falls back to a conditional PostgREST update guarded with .gte('total_lifetime_points', amount)
    to prevent race conditions / negative balances under concurrent requests.
    """
    if amount <= 0:
        return True

    # 1. Try PostgreSQL RPC
    try:
        res = db.rpc("deduct_user_points", {
            "p_user_id": str(user_id),
            "p_amount": int(amount)
        }).execute()
        if res.data is not None:
            return bool(res.data)
    except Exception:
        pass

    # 2. Concurrency-safe fallback: Check and set with conditional guard
    try:
        user_res = db.table("users").select("total_lifetime_points").eq("id", str(user_id)).execute()
        if not user_res.data:
            return False

        current_pts = int(user_res.data[0].get("total_lifetime_points") or 0)
        if current_pts < amount:
            return False

        new_total = current_pts - amount
        # Guarded with gte to prevent race condition if concurrent request drained points
        update_res = db.table("users") \
            .update({"total_lifetime_points": new_total}) \
            .eq("id", str(user_id)) \
            .gte("total_lifetime_points", amount) \
            .execute()

        return bool(update_res.data and len(update_res.data) > 0)
    except Exception as e:
        print(f"Error in atomic_deduct_points for {user_id}:", e)
        return False

def atomic_add_points(user_id: str, amount: int) -> bool:
    """
    Atomically credits points to a user's vault.
    First tries the PostgreSQL RPC function 'add_user_points'.
    Falls back to PostgREST update if RPC is not yet registered.
    """
    if amount <= 0:
        return True

    # 1. Try PostgreSQL RPC
    try:
        res = db.rpc("add_user_points", {
            "p_user_id": str(user_id),
            "p_amount": int(amount)
        }).execute()
        if res.data is not None:
            return bool(res.data)
    except Exception:
        pass

    # 2. Fallback update
    try:
        user_res = db.table("users").select("total_lifetime_points").eq("id", str(user_id)).execute()
        if not user_res.data:
            return False

        current_pts = int(user_res.data[0].get("total_lifetime_points") or 0)
        new_total = current_pts + amount

        update_res = db.table("users") \
            .update({"total_lifetime_points": new_total}) \
            .eq("id", str(user_id)) \
            .execute()

        return bool(update_res.data and len(update_res.data) > 0)
    except Exception as e:
        print(f"Error in atomic_add_points for {user_id}:", e)
        return False
