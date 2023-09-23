local key = tostring(KEYS[1]);
local charges = tostring(ARGV[1]);
local oldBalance = redis.pcall('GET', key);

if oldBalance >= charges then
    local remainingBalance = redis.pcall('DECRBY', key, charges)
    return {true, remainingBalance, charges}
else
    return {false, oldBalance, 0}
end