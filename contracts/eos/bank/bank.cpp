#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
#include <eosio/system.hpp>
#include <eosio/asset.hpp>

using namespace eosio;
using namespace std;

CONTRACT bank : public eosio::contract {
  using contract::contract;
  public:

    [[eosio::action]] void withdraw(name to, asset quantity) {
      require_auth( to );
      sub_balance(to,quantity);
      string memo = "withdraw";
      action(permission_level{get_self(), "active"_n}, "eosio.token"_n, "transfer"_n,
        std::make_tuple(get_self(),to,quantity,memo))
      .send();
    }

    [[eosio::action]] void open( const name& owner, const symbol& symbol, const name& ram_payer )
    {
      require_auth( ram_payer );

      check( is_account( owner ), "owner account does not exist" );
      check( symbol.code().to_string() == "SYS", "not SYS" );

      accounts acnts( get_self(), owner.value );
      auto it = acnts.find( symbol.code().raw() );
      if( it == acnts.end() ) {
        acnts.emplace( ram_payer, [&]( auto& a ){
          a.balance = asset{0, symbol};
        });
      }
    }

    void transfer(name from, name to, asset quantity, string memo) {
      if(from == get_self() || get_first_receiver() != "eosio.token"_n) return;
      check(memo == "bank deposit", "invalid memo");
      add_balance(from,quantity,from);
    }

  private:

    struct [[eosio::table]] account {
      asset    balance;

      uint64_t primary_key()const { return balance.symbol.code().raw(); }
    };

    typedef eosio::multi_index< "accounts"_n, account > accounts;

    void sub_balance( const name& owner, const asset& value ) {
      accounts from_acnts( get_self(), owner.value );

      const auto& from = from_acnts.get( value.symbol.code().raw(), "no balance object found" );

      print("balance: ");
      print(from.balance.amount);
      print("\n");
      check( from.balance.amount >= value.amount, "overdrawn balance" );

      from_acnts.modify( from, owner, [&]( auto& a ) {
        a.balance -= value;
      });
    }

    void add_balance( const name& owner, const asset& value, const name& ram_payer )
    {
      accounts to_acnts( get_self(), owner.value );
      auto to = to_acnts.find( value.symbol.code().raw() );
      if( to == to_acnts.end() ) {
        check(false, "open balance with bank");
      } else {
        to_acnts.modify( to, same_payer, [&]( auto& a ) {
          a.balance += value;
        });
      }
    }
};

extern "C" {
  void apply(uint64_t receiver, uint64_t code, uint64_t action) {
    if (code == name("eosio.token").value && action == name("transfer").value) {
      eosio::execute_action(eosio::name(receiver), eosio::name(code),&bank::transfer);
    } else {
      switch (action) {
        EOSIO_DISPATCH_HELPER(bank, (withdraw)(open))
      }
    }
    eosio_exit(0);
  }
}