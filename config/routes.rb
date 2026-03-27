Rails.application.routes.draw do
  devise_for :users, controllers: { sessions: "users/sessions", registrations: "users/registrations" }

  get "users/search", to: "users#search"

  resources :projects, only: [ :index, :show, :create ] do
    resources :tasks, only: [ :index, :create, :update ]
    member do
      post "add_member"
      delete "remove_member/:user_id", to: "projects#remove_member", as: :remove_member
    end
  end

  get "dashboard", to: "dashboard#index"
  root "dashboard#index"
end
